import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Map,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import API from '../../utils/api.js';

const ReportsPanel = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agent'); // agent, monthly, installation, revenue, district

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get('/reports');
      setReportsData(res.data);
    } catch (err) {
      console.error('Failed to compile reports metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-solarOrange"></div>
      </div>
    );
  }

  const { agentReport, monthlyReport, installationReport, revenueReport, districtReport } = reportsData;

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // EXPORT EXCEL (Multi-Tab Workbook using SheetJS)
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Agent sheet
    const agentWS = XLSX.utils.json_to_sheet(
      agentReport.map(a => ({
        'Agent ID': a.agentId,
        'Agent Name': a.fullName,
        'Assigned Customers': a.total,
        'Leads Converted': a.converted,
        'Leads Pending': a.pending,
        'Leads Rejected': a.rejected,
        'Conversion Ratio (%)': `${a.conversionRate}%`
      }))
    );
    XLSX.utils.book_append_sheet(wb, agentWS, 'Agent Performance');

    // 2. District sheet
    const districtWS = XLSX.utils.json_to_sheet(
      districtReport.map(d => ({
        'District Name': d.district,
        'Total Leads': d.count,
        'Installed Projects': d.installed
      }))
    );
    XLSX.utils.book_append_sheet(wb, districtWS, 'District Summary');

    // 3. Monthly sheet
    const monthlyWS = XLSX.utils.json_to_sheet(
      monthlyReport.map(m => ({
        'Month Period': m.label,
        'Leads Added': m.leads,
        'Installations Done': m.installed
      }))
    );
    XLSX.utils.book_append_sheet(wb, monthlyWS, 'Monthly Acquisitions');

    // 4. Financial sheet
    const revenueWS = XLSX.utils.json_to_sheet([
      {
        'Total Installed Capacity (kW)': `${revenueReport.totalInstalledCapacity} kW`,
        'Total Installed Revenue (Rs)': revenueReport.installedRevenue,
        'Total Pending Capacity (kW)': `${revenueReport.totalPendingCapacity} kW`,
        'Total Pending Revenue (Rs)': revenueReport.pendingRevenue,
        'Projected Gross Revenue (Rs)': revenueReport.totalRevenue
      }
    ]);
    XLSX.utils.book_append_sheet(wb, revenueWS, 'Gross Revenue');

    XLSX.writeFile(wb, `srimaan_solar_analytical_report_${Date.now()}.xlsx`);
  };

  // EXPORT CSV
  const exportToCSV = () => {
    let csvData = '';
    
    if (activeTab === 'agent') {
      const headers = ['Agent ID', 'Agent Name', 'Total Assigned', 'Converted', 'Pending', 'Rejected', 'Conversion Rate (%)'];
      const rows = agentReport.map(a => [a.agentId, a.fullName, a.total, a.converted, a.pending, a.rejected, a.conversionRate]);
      csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (activeTab === 'district') {
      const headers = ['District Name', 'Total Leads', 'Installed Projects'];
      const rows = districtReport.map(d => [d.district, d.count, d.installed]);
      csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      const headers = ['Metric', 'Installed Cap (kW)', 'Gross Value (Rs)', 'Pending Cap (kW)', 'Pending Value (Rs)', 'Gross Total (Rs)'];
      const rows = [[
        'Total Specs',
        revenueReport.totalInstalledCapacity,
        revenueReport.installedRevenue,
        revenueReport.totalPendingCapacity,
        revenueReport.pendingRevenue,
        revenueReport.totalRevenue
      ]];
      csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `srimaan_solar_${activeTab}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT PDF (using jsPDF Autotable)
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 140, 0);
    doc.text('SRIMAAN SOLAR', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Analytical Report Summary - Compiled: ${new Date().toLocaleDateString()}`, 14, 26);
    doc.line(14, 30, 196, 30);

    if (activeTab === 'agent') {
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Agent-Wise Performance Ledger', 14, 40);

      const tableData = agentReport.map(a => [
        a.agentId,
        a.fullName,
        a.total,
        a.converted,
        a.pending,
        a.rejected,
        `${a.conversionRate}%`
      ]);

      doc.autoTable({
        startY: 45,
        head: [['Agent ID', 'Agent Name', 'Assigned', 'Converted', 'Pending', 'Rejected', 'Success Rate']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 9 }
      });
    } else if (activeTab === 'district') {
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('District-Wise Installation Metrics', 14, 40);

      const tableData = districtReport.map(d => [
        d.district,
        d.count,
        d.installed
      ]);

      doc.autoTable({
        startY: 45,
        head: [['District Name', 'Total Customer Leads', 'Completed Installations']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 9 }
      });
    } else {
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Financial Solar Revenue Report', 14, 40);

      const tableData = [
        ['Installed capacity (kW)', `${revenueReport.totalInstalledCapacity} kW`, formatCurrency(revenueReport.installedRevenue)],
        ['Pending installations (kW)', `${revenueReport.totalPendingCapacity} kW`, formatCurrency(revenueReport.pendingRevenue)],
        ['Gross Projected Revenue', '-', formatCurrency(revenueReport.totalRevenue)]
      ];

      doc.autoTable({
        startY: 45,
        head: [['Description', 'Combined Capacity', 'Financial Valuation (INR)']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 10 }
      });
    }

    doc.save(`srimaan_solar_${activeTab}_report_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Reports Central</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze conversion ratios, geographic density, installation timelines, and compiled revenue.
          </p>
        </div>

        {/* Export triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 text-slate-650 dark:text-slate-300 py-2 px-3.5 text-xs font-bold transition-all hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 text-solarOrange" />
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 text-slate-650 dark:text-slate-300 py-2 px-3.5 text-xs font-bold transition-all hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-red-500" />
            Export PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 rounded-xl bg-solarOrange hover:bg-solarOrange-hover text-white py-2 px-4 text-xs font-bold shadow-md shadow-solarOrange/10 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Full Workbook Excel
          </button>
        </div>
      </div>

      {/* Revenue Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Installed Revenue</span>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 leading-none">
                {formatCurrency(revenueReport.installedRevenue)}
              </h3>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">({revenueReport.totalInstalledCapacity} kW Grid)</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Revenue</span>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 leading-none">
                {formatCurrency(revenueReport.pendingRevenue)}
              </h3>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">({revenueReport.totalPendingCapacity} kW Pipeline)</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-solarOrange"></div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-solarOrange uppercase tracking-wider">Gross Total Value</span>
              <h3 className="text-2xl font-extrabold text-solarOrange mt-1 leading-none">
                {formatCurrency(revenueReport.totalRevenue)}
              </h3>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Projected capacity valuation</p>
            </div>
            <div className="p-3 rounded-xl bg-solarOrange/10 text-solarOrange">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="glass-panel p-2 rounded-2xl flex flex-wrap gap-1.5">
        {[
          { id: 'agent', label: 'Agent Report', icon: Users },
          { id: 'district', label: 'District Report', icon: Map },
          { id: 'monthly', label: 'Installation Progress', icon: TrendingUp }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-solarOrange text-white shadow-md'
                  : 'text-slate-655 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-deepBlue-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table representation */}
        <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden">
          {activeTab === 'agent' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-deepBlue-800/40 text-slate-450 uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Agent ID</th>
                    <th className="py-4 px-6">Agent Name</th>
                    <th className="py-4 px-6 text-center">Total assigned</th>
                    <th className="py-4 px-6 text-center">Converted</th>
                    <th className="py-4 px-6 text-center">Pending</th>
                    <th className="py-4 px-6 text-center">Success Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-deepBlue-800/20 text-slate-700 dark:text-slate-300">
                  {agentReport.map(a => (
                    <tr key={a.agentId} className="hover:bg-slate-50/50 dark:hover:bg-deepBlue-850/20">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{a.agentId}</td>
                      <td className="py-4 px-6 font-semibold">{a.fullName}</td>
                      <td className="py-4 px-6 text-center font-semibold">{a.total}</td>
                      <td className="py-4 px-6 text-center text-emerald-500 font-semibold">{a.converted}</td>
                      <td className="py-4 px-6 text-center text-amber-500 font-semibold">{a.pending}</td>
                      <td className="py-4 px-6 text-center font-bold text-solarOrange">{a.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'district' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-deepBlue-800/40 text-slate-450 uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">District Area</th>
                    <th className="py-4 px-6 text-center">Total Customer Leads</th>
                    <th className="py-4 px-6 text-center">Installed Sites</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-deepBlue-800/20 text-slate-700 dark:text-slate-300">
                  {districtReport.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-400">No district logs recorded yet.</td>
                    </tr>
                  ) : (
                    districtReport.map(d => (
                      <tr key={d.district} className="hover:bg-slate-50/50 dark:hover:bg-deepBlue-850/20">
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{d.district}</td>
                        <td className="py-4 px-6 text-center font-semibold">{d.count}</td>
                        <td className="py-4 px-6 text-center text-green-500 font-semibold">{d.installed}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-deepBlue-800/40 text-slate-450 uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Month Period</th>
                    <th className="py-4 px-6 text-center">Leads Added</th>
                    <th className="py-4 px-6 text-center">Completed Installations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-deepBlue-800/20 text-slate-700 dark:text-slate-300">
                  {monthlyReport.map(m => (
                    <tr key={m.label} className="hover:bg-slate-50/50 dark:hover:bg-deepBlue-850/20">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{m.label}</td>
                      <td className="py-4 px-6 text-center font-semibold">{m.leads}</td>
                      <td className="py-4 px-6 text-center text-green-500 font-semibold">{m.installed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Graphical charts visualization */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Visual Analytics</h3>

          <div className="h-64 w-full">
            {activeTab === 'agent' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentReport} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-deepBlue-800/40" />
                  <XAxis dataKey="fullName" stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="conversionRate" name="Success Rate (%)" fill="#FF8C00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'district' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtReport} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-deepBlue-800/40" />
                  <XAxis dataKey="district" stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="count" name="Leads" fill="#FF8C00" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="installed" name="Installs" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'monthly' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyReport} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportMonthlyGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-deepBlue-800/40" />
                  <XAxis dataKey="label" stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Area type="monotone" dataKey="installed" name="Installed" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#reportMonthlyGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;
