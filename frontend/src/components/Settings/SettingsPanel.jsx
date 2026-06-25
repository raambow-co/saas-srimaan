import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Database,
  Sliders,
  Upload,
  Download,
  AlertTriangle,
  Loader,
  PlusCircle,
  FileText
} from 'lucide-react';
import API, { BACKEND_URL } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const SettingsPanel = () => {
  const { companySettings, logoSrc, refreshBranding } = useAuth();
  
  const [activeTab, setActiveTab] = useState('branding'); // branding, admins, database, audits
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Branding States
  const [companyName, setCompanyName] = useState('');
  const [logoFile, setLogoFile] = useState(null);

  // New Admin States
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Restore Database States
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditsLoading, setAuditsLoading] = useState(false);

  useEffect(() => {
    if (companySettings) {
      setCompanyName(companySettings.companyName || '');
    }
  }, [companySettings]);

  useEffect(() => {
    if (activeTab === 'audits') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchAuditLogs = async () => {
    setAuditsLoading(true);
    try {
      const res = await API.get('/settings/audit-logs');
      setAuditLogs(res.data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setAuditsLoading(false);
    }
  };

  const handleBrandingSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('companyName', companyName);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      await API.put('/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Branding settings updated successfully!');
      setLogoFile(null);
      await refreshBranding();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) return;

    setAdminLoading(true);
    setError('');
    setSuccess('');

    try {
      await API.post('/settings/admins', {
        username: adminUsername,
        password: adminPassword,
        email: adminEmail
      });
      setSuccess(`Admin account "${adminUsername}" registered successfully!`);
      setAdminUsername('');
      setAdminPassword('');
      setAdminEmail('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to register admin');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      // Trigger native download
      const response = await API.get('/settings/backup', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `srimaan_solar_backup_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Database backup generated successfully!');
    } catch (err) {
      console.error('Backup failed:', err);
      setError('Database backup failed to compile.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    if (!restoreFile) return;

    if (!window.confirm('WARNING: Restoring the database will drop all active tables and replace them with the backup dataset. Proceed?')) {
      return;
    }

    setRestoreLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', restoreFile);

    try {
      await API.post('/settings/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Database successfully restored from backup file!');
      setRestoreFile(null);
      await refreshBranding();
    } catch (err) {
      console.error('Restore failed:', err);
      setError(err.response?.data?.message || 'Database restore failed.');
    } finally {
      setRestoreLoading(false);
      // Reset input element
      document.getElementById('db_restore_file_input').value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Branding & System Configuration</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure company branding options, register admins, backup dataset models, or review audit timelines.
        </p>
      </div>

      {/* Global Success / Error callouts */}
      {success && (
        <div className="rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200/50 p-4 text-xs font-semibold text-green-600 dark:text-green-400">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Settings layout tabs */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Sidebar Tabs Navigation */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="glass-panel p-2.5 rounded-3xl space-y-1">
            {[
              { id: 'branding', label: 'Company Branding', icon: Sliders },
              { id: 'admins', label: 'Access Control', icon: Shield },
              { id: 'database', label: 'Database Backup', icon: Database },
              { id: 'audits', label: 'Audit Timeline Logs', icon: FileText }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    setError('');
                    setSuccess('');
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all text-left ${
                    activeTab === t.id
                      ? 'bg-solarOrange text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-deepBlue-800'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Tab Panel Panels */}
        <div className="flex-1 glass-panel p-6 rounded-3xl">
          {/* 1. Branding Settings */}
          {activeTab === 'branding' && (
            <form onSubmit={handleBrandingSave} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">White Labeling Branding</h3>
                <p className="text-xs text-slate-400 mt-0.5">Customize default branding options for portals and reports.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-800 dark:text-slate-100"
                    placeholder="Srimaan Solar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Company Logo Graphic
                  </label>
                  
                  {/* Current Logo Preview */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-deepBlue-950 rounded-2xl border border-slate-200 dark:border-deepBlue-850 flex items-center justify-center p-2">
                      {logoSrc ? (
                        <img src={logoSrc} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                      ) : (
                        <span className="text-2xl font-bold text-solarOrange">S</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-700 dark:text-slate-350">Active Logo Graphic</p>
                      <p className="text-slate-400">Dimensions: Standard transparent PNG recommended.</p>
                    </div>
                  </div>

                  {/* Upload box */}
                  <div className="flex items-center justify-center border border-dashed border-slate-200 dark:border-deepBlue-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-deepBlue-950/10 text-center relative hover:bg-slate-50 transition-colors max-w-sm">
                    <Upload className="h-6 w-6 text-slate-400 mb-2" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350">Select New Logo file</span>
                    <span className="text-[9px] text-slate-400 mt-1">
                      {logoFile ? logoFile.name : 'PNG / JPG format'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-deepBlue-800/80 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-solarOrange hover:bg-solarOrange-hover text-white py-2.5 px-6 text-xs font-bold transition-all shadow-md shadow-solarOrange/10 flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'Save Branding Changes'}
                </button>
              </div>
            </form>
          )}

          {/* 2. Access controls (Create New Admin) */}
          {activeTab === 'admins' && (
            <form onSubmit={handleCreateAdmin} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Access Control</h3>
                <p className="text-xs text-slate-400 mt-0.5">Register new administrative accounts.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange text-slate-800 dark:text-slate-100"
                    placeholder="Srimaan_solar_2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange text-slate-800 dark:text-slate-100"
                    placeholder="admin2@srimaansolar.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange text-slate-800 dark:text-slate-100"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-deepBlue-800/80 flex justify-end">
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="rounded-xl bg-solarOrange hover:bg-solarOrange-hover text-white py-2.5 px-6 text-xs font-bold transition-all shadow-md shadow-solarOrange/10 flex items-center justify-center gap-1.5"
                >
                  {adminLoading ? <Loader className="h-4 w-4 animate-spin" /> : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Register Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 3. Database management (Backup & Restore) */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Database Backup & Restoring</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage full database snapshots to prevent data loss.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Backup Block */}
                <div className="bg-slate-50/50 dark:bg-deepBlue-950/20 border border-slate-100 dark:border-deepBlue-850/40 rounded-3xl p-5 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                      <Download className="h-4.5 w-4.5 text-solarOrange" />
                      Export Database Backup
                    </h4>
                    <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">
                      Download a single JSON file snapshot containing all collections (admins, agents, customers, notifications, audit logs).
                    </p>
                  </div>
                  <button
                    onClick={handleBackup}
                    disabled={loading}
                    className="mt-4 rounded-xl border border-solarOrange hover:bg-solarOrange text-solarOrange hover:text-white py-2 px-4 text-xs font-bold transition-all flex items-center justify-center gap-1 max-w-[140px]"
                  >
                    {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'Run Backup'}
                  </button>
                </div>

                {/* Restore Block */}
                <form onSubmit={handleRestore} className="bg-slate-50/50 dark:bg-deepBlue-950/20 border border-slate-100 dark:border-deepBlue-850/40 rounded-3xl p-5 flex flex-col justify-between min-h-[160px] space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                      Import Database Restore
                    </h4>
                    <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">
                      Upload a JSON backup file to restore database state. WARNING: This replaces current active database tables.
                    </p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <label className="flex-1 rounded-xl border border-dashed border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-900/40 py-2 px-3 text-xs text-center cursor-pointer hover:bg-white truncate">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {restoreFile ? restoreFile.name : 'Select JSON backup file...'}
                      </span>
                      <input
                        type="file"
                        id="db_restore_file_input"
                        accept=".json"
                        onChange={(e) => setRestoreFile(e.target.files[0])}
                        className="hidden"
                        disabled={restoreLoading}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={!restoreFile || restoreLoading}
                      className="rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-slate-300 dark:disabled:bg-deepBlue-800 text-white py-2 px-4 text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1"
                    >
                      {restoreLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Restore'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 4. Audit Timeline Logs */}
          {activeTab === 'audits' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-deepBlue-850/60 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Security Audit Log Registry</h3>
                  <p className="text-xs text-slate-405 mt-0.5">Logs of administrative actions executed in the system.</p>
                </div>
                <button
                  onClick={fetchAuditLogs}
                  className="rounded-xl border border-slate-200 dark:border-deepBlue-800 hover:bg-slate-50 py-1.5 px-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 transition-all shrink-0"
                >
                  Refresh Logs
                </button>
              </div>

              {auditsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-solarOrange" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center text-slate-400 py-16 text-xs">No audit logs recorded.</div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log._id || log.id}
                      className="rounded-2xl border border-slate-150/60 dark:border-deepBlue-800 bg-slate-50/10 dark:bg-deepBlue-950/20 p-4 text-xs flex justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] bg-solarOrange/10 text-solarOrange px-2 py-0.5 rounded-full">
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-350">by: {log.actor}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 mt-0.5 text-right font-medium">
                        {new Date(log.timestamp).toLocaleDateString()}<br/>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
