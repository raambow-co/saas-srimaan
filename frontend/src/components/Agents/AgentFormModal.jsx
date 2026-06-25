import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import API from '../../utils/api.js';

const AgentFormModal = ({ isOpen, onClose, onSave, agentToEdit = null }) => {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!agentToEdit;

  useEffect(() => {
    if (agentToEdit) {
      setFullName(agentToEdit.fullName || '');
      setMobileNumber(agentToEdit.mobileNumber || '');
      setEmail(agentToEdit.email || '');
      setAddress(agentToEdit.address || '');
      setUsername(agentToEdit.username || '');
    } else {
      setFullName('');
      setMobileNumber('');
      setEmail('');
      setAddress('');
      setUsername('');
      setPassword('');
    }
    setError('');
  }, [agentToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !mobileNumber || !email || !username || (!isEditMode && !password)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        // Edit agent (excl username/password)
        const res = await API.put(`/agents/${agentToEdit._id || agentToEdit.id}`, {
          fullName,
          mobileNumber,
          email,
          address
        });
        onSave(res.data);
      } else {
        // Create agent
        const res = await API.post('/agents', {
          fullName,
          mobileNumber,
          email,
          address,
          username,
          password
        });
        onSave(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save agent profile:', err);
      setError(err.response?.data?.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/60 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 shadow-2xl overflow-hidden relative animate-slide-up">
        {/* Glow Line Top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-solarOrange to-orange-500"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-deepBlue-800/80 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {isEditMode ? `Edit Agent: ${agentToEdit.fullName}` : 'Create New Agent'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-deepBlue-800/80 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-800/20 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm text-slate-850 dark:text-slate-100 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all"
                placeholder="Ravi Kumar"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm text-slate-850 dark:text-slate-100 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all"
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm text-slate-850 dark:text-slate-100 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all"
                placeholder="ravi@gmail.com"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Home/Office Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm text-slate-850 dark:text-slate-100 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all"
                placeholder="Hyderabad, Telangana"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-deepBlue-800/40 pt-4 mt-2">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Login Credentials
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isEditMode}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm text-slate-850 dark:text-slate-100 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="ravi_kumar"
                  required
                />
              </div>

              {!isEditMode && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm text-slate-850 dark:text-slate-100 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-deepBlue-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-deepBlue-800 hover:bg-slate-50 dark:hover:bg-deepBlue-850 text-slate-600 dark:text-slate-300 py-2.5 px-4 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-solarOrange hover:bg-solarOrange-hover text-white py-2.5 px-4 text-xs font-bold transition-all shadow-md shadow-solarOrange/10 flex items-center justify-center gap-1.5 min-w-[80px]"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : (isEditMode ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentFormModal;
