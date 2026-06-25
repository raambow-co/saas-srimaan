import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  UserCheck,
  UserX,
  Key,
  Trash2,
  TrendingUp,
  X,
  Award,
  Loader
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
import AgentFormModal from './AgentFormModal.jsx';

const AgentList = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal Control States
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  const [perfOpen, setPerfOpen] = useState(false);
  const [perfData, setPerfData] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/agents');
      setAgents(res.data);
    } catch (err) {
      console.error('Failed to load agents list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateClick = () => {
    setSelectedAgent(null);
    setFormOpen(true);
  };

  const handleEditClick = (agent) => {
    setSelectedAgent(agent);
    setFormOpen(true);
  };

  const handleFormSave = () => {
    fetchAgents();
  };

  // Toggle agent suspension status
  const handleToggleSuspend = async (agent) => {
    try {
      const res = await API.put(`/agents/${agent._id || agent.id}/suspend`);
      setAgents(prev => prev.map(a => (a._id === agent._id || a.id === agent.id ? res.data : a)));
    } catch (err) {
      console.error('Failed to toggle agent status:', err);
    }
  };

  // Delete agent
  const handleDeleteAgent = async (agent) => {
    if (!window.confirm(`Are you sure you want to delete Agent "${agent.fullName}"? All their customers will become Unassigned.`)) {
      return;
    }

    try {
      await API.delete(`/agents/${agent._id || agent.id}`);
      setAgents(prev => prev.filter(a => a._id !== agent._id && a.id !== agent.id));
    } catch (err) {
      console.error('Failed to delete agent:', err);
    }
  };

  // Open password reset modal
  const handlePasswordResetClick = (agent) => {
    setSelectedAgent(agent);
    setNewPassword('');
    setPwSuccess('');
    setPwOpen(true);
  };

  const handlePasswordResetSave = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setPwLoading(true);
    try {
      await API.put(`/agents/${selectedAgent._id || selectedAgent.id}/reset-password`, { newPassword });
      setPwSuccess('Password reset successfully!');
      setTimeout(() => setPwOpen(false), 1200);
    } catch (err) {
      console.error('Failed to reset password:', err);
    } finally {
      setPwLoading(false);
    }
  };

  // View agent performance
  const handleViewPerformance = async (agent) => {
    setSelectedAgent(agent);
    setPerfLoading(true);
    setPerfOpen(true);
    try {
      const res = await API.get(`/agents/${agent._id || agent.id}/performance`);
      setPerfData(res.data);
    } catch (err) {
      console.error('Failed to load performance report:', err);
    } finally {
      setPerfLoading(false);
    }
  };

  const closePerfModal = () => {
    setPerfOpen(false);
    setPerfData(null);
  };

  // Filters application
  const filteredAgents = agents.filter(agent => {
    const query = searchQuery.toLowerCase();
    const nameMatch = agent.fullName.toLowerCase().includes(query);
    const idMatch = agent.agentId.toLowerCase().includes(query);
    const emailMatch = agent.email.toLowerCase().includes(query);
    const searchMatch = nameMatch || idMatch || emailMatch;

    if (statusFilter === 'All') return searchMatch;
    return searchMatch && agent.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Agents Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, update, suspend, or evaluate individual sales agent performances.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center justify-center gap-2 rounded-2xl bg-solarOrange hover:bg-solarOrange-hover text-white py-3 px-5 text-sm font-bold shadow-lg shadow-solarOrange/20 transition-all transform active:scale-95 shrink-0"
        >
          <Plus className="h-5 w-5" />
          Create Agent
        </button>
      </div>

      {/* Filters toolbar */}
      <div className="glass-panel p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all"
            placeholder="Search agents by ID, name, or email..."
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status:</span>
          {['All', 'Active', 'Suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
                statusFilter === status
                  ? 'bg-solarOrange border-solarOrange text-white shadow-md'
                  : 'bg-white dark:bg-deepBlue-900 border-slate-200 dark:border-deepBlue-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-deepBlue-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-solarOrange"></div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center text-slate-400 py-16 text-sm">No agents match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-deepBlue-800/40 text-slate-450 uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Full Name</th>
                  <th className="py-4 px-6">Contact Info</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Joining Date</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-deepBlue-800/20 text-slate-700 dark:text-slate-300">
                {filteredAgents.map((agent) => (
                  <tr key={agent._id || agent.id} className="hover:bg-slate-50/50 dark:hover:bg-deepBlue-850/20 transition-colors">
                    <td className="py-4.5 px-6 font-bold text-slate-900 dark:text-white">{agent.agentId}</td>
                    <td className="py-4.5 px-6 font-semibold">
                      <div className="flex flex-col">
                        <span>{agent.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">@{agent.username}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">{agent.mobileNumber}</span>
                        <span className="text-slate-400 font-normal">{agent.email}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6 truncate max-w-[150px]">{agent.address || 'N/A'}</td>
                    <td className="py-4.5 px-6">{agent.joiningDate}</td>
                    <td className="py-4.5 px-6 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                        agent.status === 'Active'
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right space-x-1 whitespace-nowrap">
                      {/* View Performance Button */}
                      <button
                        onClick={() => handleViewPerformance(agent)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-deepBlue-800 hover:border-solarOrange text-slate-600 dark:text-slate-400 hover:text-solarOrange hover:bg-solarOrange/5 transition-all"
                        title="View Performance"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>

                      {/* Suspend Toggle Button */}
                      <button
                        onClick={() => handleToggleSuspend(agent)}
                        className={`p-1.5 rounded-lg border border-slate-200 dark:border-deepBlue-800 transition-all ${
                          agent.status === 'Active'
                            ? 'hover:border-red-500 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5'
                            : 'hover:border-green-500 text-slate-600 dark:text-slate-400 hover:text-green-500 hover:bg-green-500/5'
                        }`}
                        title={agent.status === 'Active' ? 'Suspend Agent' : 'Activate Agent'}
                      >
                        {agent.status === 'Active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>

                      {/* Password Reset Button */}
                      <button
                        onClick={() => handlePasswordResetClick(agent)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-deepBlue-800 hover:border-solarOrange text-slate-600 dark:text-slate-400 hover:text-solarOrange hover:bg-solarOrange/5 transition-all"
                        title="Reset Password"
                      >
                        <Key className="h-4 w-4" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(agent)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-deepBlue-800 hover:border-solarOrange text-slate-600 dark:text-slate-400 hover:text-solarOrange hover:bg-solarOrange/5 transition-all"
                        title="Edit Details"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteAgent(agent)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-deepBlue-800 hover:border-red-500 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
                        title="Delete Agent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Agent Add/Edit Form Modal */}
      <AgentFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleFormSave}
        agentToEdit={selectedAgent}
      />

      {/* Password Reset Modal */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 shadow-2xl p-6 relative animate-slide-up">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Reset Agent Password</h3>
            <p className="text-xs text-slate-500 mt-1">Set a new password for <strong>{selectedAgent?.fullName}</strong>.</p>
            
            {pwSuccess && (
              <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/40 p-3 text-xs font-semibold text-green-600 dark:text-green-400">
                {pwSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordResetSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3 text-sm text-slate-800 outline-none focus:border-solarOrange"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setPwOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-deepBlue-800 px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="rounded-xl bg-solarOrange text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-1"
                >
                  {pwLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : 'Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {perfOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 shadow-2xl overflow-hidden relative animate-slide-up">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-solarOrange to-orange-500"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-deepBlue-850 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Agent Performance Evaluator</h3>
                <p className="text-xs text-slate-400">Reviewing metrics for: {selectedAgent?.fullName}</p>
              </div>
              <button
                onClick={closePerfModal}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-deepBlue-800/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            {perfLoading ? (
              <div className="flex h-80 items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-solarOrange" />
              </div>
            ) : !perfData ? (
              <div className="p-8 text-center text-slate-400 text-xs">Error compiling statistics.</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Stats Breakdown Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-deepBlue-850/30 border border-slate-100 dark:border-deepBlue-800/30 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Leads</span>
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{perfData.stats.totalCustomers}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-deepBlue-850/30 border border-slate-100 dark:border-deepBlue-800/30 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</span>
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{perfData.stats.pendingCustomers}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-deepBlue-850/30 border border-slate-100 dark:border-deepBlue-800/30 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Installed</span>
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{perfData.stats.installedCustomers}</p>
                  </div>
                  <div className="bg-solarOrange/5 border border-solarOrange/10 rounded-2xl p-4 text-center relative overflow-hidden flex flex-col justify-center items-center">
                    <span className="text-[10px] font-bold text-solarOrange uppercase tracking-wider flex items-center gap-0.5">
                      <Award className="h-3.5 w-3.5" />
                      Success
                    </span>
                    <p className="text-2xl font-extrabold text-solarOrange mt-1">{perfData.stats.conversionRate}%</p>
                  </div>
                </div>

                {/* Graph */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-solarOrange" />
                    Client Acquisition Rate
                  </h4>
                  <div className="h-44 w-full bg-slate-50 dark:bg-deepBlue-950/20 border border-slate-100 dark:border-deepBlue-850/30 rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={perfData.chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="agentPerfLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-deepBlue-800/40" />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={9} tickLine={false} />
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
                        <Area type="monotone" dataKey="leads" name="Leads added" stroke="#FF8C00" strokeWidth={2} fillOpacity={1} fill="url(#agentPerfLeads)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-deepBlue-800/80">
                  <button
                    onClick={closePerfModal}
                    className="rounded-xl bg-slate-100 dark:bg-deepBlue-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 px-5 hover:bg-slate-200"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentList;
