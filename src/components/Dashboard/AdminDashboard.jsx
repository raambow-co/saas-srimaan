import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CalendarDays,
  Hourglass,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import API from '../../utils/api.js';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalCustomers: 0,
    todaysLeads: 0,
    pendingCustomers: 0,
    approvedCustomers: 0,
    rejectedCustomers: 0
  });
  const [timeline, setTimeline] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await API.get('/settings/stats');
        setStats(statsRes.data.stats);
        setTimeline(statsRes.data.timeline);

        const reportsRes = await API.get('/reports');
        setReportsData(reportsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-solarOrange"></div>
      </div>
    );
  }

  // Cards setup
  const cards = [
    { title: 'Total Agents', value: stats.totalAgents, icon: Users, color: 'from-blue-500 to-indigo-600', path: '/agents' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: UserCheck, color: 'from-emerald-500 to-teal-600', path: '/customers' },
    { title: "Today's Leads", value: stats.todaysLeads, icon: CalendarDays, color: 'from-amber-500 to-solarOrange', path: '/customers' },
    { title: 'Pending Customers', value: stats.pendingCustomers, icon: Hourglass, color: 'from-orange-400 to-amber-600', path: '/customers' },
    { title: 'Approved Customers', value: stats.approvedCustomers, icon: ShieldCheck, color: 'from-green-500 to-emerald-600', path: '/customers' },
    { title: 'Rejected Customers', value: stats.rejectedCustomers, icon: ShieldAlert, color: 'from-rose-500 to-red-600', path: '/customers' },
  ];

  // Recharts Chart configurations
  const areaChartData = reportsData?.monthlyReport || [];
  const statusData = reportsData ? [
    { name: 'New Leads', value: reportsData.installationReport.newLead, color: '#3B82F6' },
    { name: 'In Progress', value: reportsData.installationReport.inProgress + reportsData.installationReport.siteInspection + reportsData.installationReport.docVerification, color: '#F59E0B' },
    { name: 'Approved', value: reportsData.installationReport.approved + reportsData.installationReport.installationPending, color: '#FF8C00' },
    { name: 'Installed', value: reportsData.installationReport.installed, color: '#10B981' },
    { name: 'Rejected', value: reportsData.installationReport.rejected, color: '#EF4444' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor real-time company statistics, agent operations, and solar installations.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(c.path)}
              className="glass-panel glass-panel-hover p-6 rounded-3xl cursor-pointer relative overflow-hidden group"
            >
              {/* Bottom decorative color glow */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${c.color}`} />
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    {c.title}
                  </span>
                  <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 leading-none">
                    {c.value}
                  </h3>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-tr ${c.color} text-white shadow-md shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Line Chart: Lead Acquisitons */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-solarOrange" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Lead Acquisition Trends</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Last 6 Months</span>
          </div>

          <div className="h-72 w-full">
            {areaChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400 text-xs">No chart data compiled.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-deepBlue-800/60" />
                  <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="leads" name="Leads Added" stroke="#FF8C00" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut Chart: Status distribution */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Installation Status</h3>
            <p className="text-xs text-slate-400">Total customer status segmentation</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {statusData.length === 0 ? (
              <div className="text-slate-400 text-xs">No status data to plot.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-medium border-t border-slate-100 dark:border-deepBlue-800/80 pt-4">
            {statusData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-500 dark:text-slate-400 truncate">{d.name}:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity / Timeline feed */}
      <div className="glass-panel p-6 rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-deepBlue-800/60 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-solarOrange" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Recent Activities</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Timeline Feed</span>
        </div>

        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
          {timeline.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-xs">No activities recorded yet.</div>
          ) : (
            timeline.map((act, i) => (
              <div key={i} className="flex gap-4 relative">
                {/* Visual timeline connectors */}
                {i !== timeline.length - 1 && (
                  <div className="absolute top-8 left-4 bottom-0 w-0.5 bg-slate-200 dark:bg-deepBlue-800" />
                )}
                
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-deepBlue-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-deepBlue-800/50">
                  <Activity className="h-4 w-4 text-solarOrange" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {act.customerName} <span className="text-xs font-semibold text-solarOrange">({act.customerId})</span>
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Action:</span> {act.action.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {act.notes}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase bg-slate-100 dark:bg-deepBlue-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">
                      by: {act.performedBy}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
