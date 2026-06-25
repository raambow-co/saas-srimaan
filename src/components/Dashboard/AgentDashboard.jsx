import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  PlusCircle,
  FileBadge,
  CheckCircle,
  TrendingUp,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import API from '../../utils/api.js';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [agentData, setAgentData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch current agent statistics
  useEffect(() => {
    const fetchAgentDashboard = async () => {
      try {
        const userStr = localStorage.getItem('srimaan_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        
        // Retrieve agent info
        const agentsListRes = await API.get('/agents');
        const agentProfile = agentsListRes.data.find(a => a.agentId === user.agentId);

        if (agentProfile) {
          const perfRes = await API.get(`/agents/${agentProfile._id || agentProfile.id}/performance`);
          setAgentData(perfRes.data);
        }

        const customersRes = await API.get('/customers');
        setCustomers(customersRes.data);
      } catch (err) {
        console.error('Failed to load agent dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-solarOrange"></div>
      </div>
    );
  }

  const stats = agentData?.stats || {
    totalCustomers: 0,
    pendingCustomers: 0,
    approvedCustomers: 0,
    rejectedCustomers: 0,
    installedCustomers: 0,
    conversionRate: 0
  };

  const chartData = agentData?.chartData || [];

  const cards = [
    { title: 'My Customers', value: stats.totalCustomers, icon: Users, color: 'from-blue-500 to-indigo-600' },
    { title: 'Pending Installs', value: stats.totalCustomers - stats.installedCustomers, icon: FileBadge, color: 'from-amber-500 to-solarOrange' },
    { title: 'Successful Installs', value: stats.installedCustomers, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
  ];

  // Get recent 5 customers assigned to this agent
  const recentCustomers = customers.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Agent Panel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your customers, register new leads, and review your performance.
          </p>
        </div>
        <button
          onClick={() => navigate('/agent-customers', { state: { openAddModal: true } })}
          className="flex items-center justify-center gap-2 rounded-2xl bg-solarOrange hover:bg-solarOrange-hover text-white py-3 px-5 text-sm font-bold shadow-lg shadow-solarOrange/20 transition-all transform active:scale-95 shrink-0"
        >
          <PlusCircle className="h-5 w-5" />
          Add Customer
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="glass-panel p-6 rounded-3xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.title}</span>
                  <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 leading-none">
                    {c.value}
                  </h3>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-tr ${c.color} text-white shadow-md`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance graphs and gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Gauge */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-solarOrange" />
              Conversion Gauge
            </h3>
          </div>

          <div className="relative flex items-center justify-center h-40 w-40 mt-2">
            {/* SVG Arc Gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-slate-100 dark:text-deepBlue-800"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="402"
                strokeDashoffset={402 - (402 * stats.conversionRate) / 100}
                className="text-solarOrange transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white leading-none">
                {stats.conversionRate}%
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase mt-1">
                Approved Leads
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed max-w-[200px]">
            Keep adding verified documents and completing audits to boost your rating!
          </p>
        </div>

        {/* Acquisitions Line Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-solarOrange" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">My Monthly Leads</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Activity History</span>
          </div>

          <div className="h-48 w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400 text-xs">No chart data compiled yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="agentLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-deepBlue-800/60" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke="#FF8C00" strokeWidth={2.5} fillOpacity={1} fill="url(#agentLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Customer List snapshot */}
      <div className="glass-panel p-6 rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-deepBlue-800/65 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-solarOrange" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Recent Customer Leads</h3>
          </div>
          <button
            onClick={() => navigate('/agent-customers')}
            className="flex items-center gap-1 text-xs font-semibold text-solarOrange hover:text-solarOrange-hover transition-colors"
          >
            Manage Customers
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentCustomers.length === 0 ? (
            <div className="text-center text-slate-400 py-6 text-xs">You have not registered any customer leads yet.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-deepBlue-800/40 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-2">Customer ID</th>
                  <th className="py-3 px-2">Customer Name</th>
                  <th className="py-3 px-2">Mobile Number</th>
                  <th className="py-3 px-2">Mandal / District</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-deepBlue-800/20 text-slate-700 dark:text-slate-300">
                {recentCustomers.map((cust) => (
                  <tr key={cust._id || cust.id} className="hover:bg-slate-50/50 dark:hover:bg-deepBlue-850/20">
                    <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{cust.customerId}</td>
                    <td className="py-3.5 px-2 font-semibold">{cust.customerName}</td>
                    <td className="py-3.5 px-2">{cust.mobileNumber}</td>
                    <td className="py-3.5 px-2">{cust.mandal || 'N/A'} / {cust.district || 'N/A'}</td>
                    <td className="py-3.5 px-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-[10px] ${
                        cust.status === 'Installed'
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                          : cust.status === 'Rejected'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                          : cust.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {cust.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
