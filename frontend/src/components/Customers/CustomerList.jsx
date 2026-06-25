import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Upload,
  Eye,
  Trash2,
  Filter,
  X,
  FileSpreadsheet,
  Loader
} from 'lucide-react';
import API from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import CustomerFormModal from './CustomerFormModal.jsx';
import CustomerDetailModal from './CustomerDetailModal.jsx';

const CustomerList = () => {
  const { isAdmin, user } = useAuth();
  const location = useLocation();

  const [customers, setCustomers] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // CSV Import State
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    if (isAdmin) {
      const fetchAgents = async () => {
        try {
          const res = await API.get('/agents');
          setAgentsList(res.data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchAgents();
    }
  }, [isAdmin]);

  // Handle shortcut modal opening (e.g. from Dashboard shortcut state)
  useEffect(() => {
    if (location.state?.openAddModal) {
      handleCreateClick();
      // Clear location state history
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreateClick = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  const handleEditClick = (cust) => {
    setSelectedCustomer(cust);
    setFormOpen(true);
  };

  const handleViewClick = (cust) => {
    setSelectedCustomer(cust);
    setDetailOpen(true);
  };

  const handleSave = () => {
    fetchCustomers();
  };

  const handleDelete = async (cust) => {
    if (!window.confirm(`Are you sure you want to permanently delete customer "${cust.customerName}"?`)) {
      return;
    }
    try {
      await API.delete(`/customers/${cust._id || cust.id}`);
      setCustomers(prev => prev.filter(c => c._id !== cust._id && c.id !== cust.id));
    } catch (err) {
      console.error('Failed to delete customer:', err);
    }
  };

  // Bulk Import CSV
  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportLoading(true);
    setImportError('');
    setImportSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await API.post('/customers/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setImportSuccess(res.data.message);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to import CSV:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'CSV import validation error.';
      setImportError(errMsg);
    } finally {
      setImportLoading(false);
      // reset file input
      e.target.value = '';
    }
  };

  // Bulk Export CSV client-side
  const handleCSVExport = () => {
    if (customers.length === 0) return;
    
    // Compile headings
    const headings = [
      'Customer ID', 'Customer Name', 'Aadhaar Number', 'Mobile Number',
      'House Number', 'Full Address', 'Village', 'Mandal', 'District',
      'State', 'Pincode', 'Solar Capacity (kW)', 'Electricity Bill (Rs)',
      'Assigned Agent', 'Status', 'Joining Date'
    ];

    const rows = filteredCustomers.map(c => [
      c.customerId,
      c.customerName,
      `'${c.aadhaarNumber}`, // Single quote to prevent Excel scientific formatting
      c.mobileNumber,
      c.houseNumber || '',
      c.fullAddress?.replace(/,/g, ';') || '',
      c.village || '',
      c.mandal || '',
      c.district || '',
      c.state || '',
      c.pincode || '',
      c.solarCapacityRequired || 0,
      c.electricityBillAmount || 0,
      c.assignedAgent || 'Unassigned',
      c.status,
      new Date(c.createdAt).toLocaleDateString()
    ]);

    // Build CSV file content
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headings.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `srimaan_customers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compile unique lists of districts for filter selection
  const uniqueDistricts = Array.from(new Set(customers.map(c => c.district).filter(Boolean)));

  // Apply filters
  const filteredCustomers = customers.filter(c => {
    // 1. Search Query Match
    const query = searchQuery.toLowerCase();
    const nameMatch = c.customerName.toLowerCase().includes(query);
    const idMatch = c.customerId.toLowerCase().includes(query);
    const mobileMatch = c.mobileNumber.toLowerCase().includes(query);
    const aadhaarMatch = c.aadhaarNumber.toLowerCase().includes(query);
    const searchMatch = nameMatch || idMatch || mobileMatch || aadhaarMatch;

    // 2. Status Match
    const statusMatch = statusFilter === 'All' || c.status === statusFilter;

    // 3. Agent Match (Only applies to Admin view filters)
    const agentMatch = agentFilter === 'All' || c.assignedAgent === agentFilter;

    // 4. District Match
    const districtMatch = districtFilter === 'All' || c.district === districtFilter;

    return searchMatch && statusMatch && agentMatch && districtMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Customer Records</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin ? 'Manage all company accounts, run bulk imports, and assign agents.' : 'Manage your assigned customer list.'}
          </p>
        </div>
        
        {/* Buttons toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCSVExport}
            disabled={filteredCustomers.length === 0}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900/60 text-slate-650 dark:text-slate-300 py-2.5 px-4 text-xs font-bold transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="h-4.5 w-4.5 text-green-500 shrink-0" />
            Export CSV
          </button>
          
          {/* CSV Bulk Import (Admin Only) */}
          {isAdmin && (
            <label className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900/60 text-slate-650 dark:text-slate-300 py-2.5 px-4 text-xs font-bold cursor-pointer transition-all hover:bg-slate-50">
              <Upload className="h-4.5 w-4.5 text-solarOrange shrink-0" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
                disabled={importLoading}
              />
            </label>
          )}

          <button
            onClick={handleCreateClick}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-solarOrange hover:bg-solarOrange-hover text-white py-2.5 px-4 text-xs font-bold shadow-md shadow-solarOrange/25 transition-all transform active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Customer
          </button>
        </div>
      </div>

      {/* CSV Status Alerts */}
      {importSuccess && (
        <div className="rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200/50 p-4 text-xs font-semibold text-green-600 dark:text-green-400">
          {importSuccess}
        </div>
      )}
      {importError && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          {importError}
        </div>
      )}

      {/* Filters Dashboard Toolbar */}
      <div className="glass-panel p-4 rounded-3xl space-y-4">
        {/* Search */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 pl-11 pr-4 text-sm text-slate-805 placeholder-slate-400 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all dark:text-slate-100"
            placeholder="Search by customer ID, name, mobile, or Aadhaar..."
          />
        </div>

        {/* Dropdowns filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Status Option</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-905 py-2 px-3 text-xs outline-none focus:border-solarOrange text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Statuses</option>
              {['New Lead', 'In Progress', 'Site Inspection', 'Document Verification', 'Approved', 'Installation Pending', 'Installed', 'Rejected'].map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* District filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">District Area</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-905 py-2 px-3 text-xs outline-none focus:border-solarOrange text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Districts</option>
              {uniqueDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Agent filter (Admin Only) */}
          {isAdmin ? (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Sales Agent</label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-905 py-2 px-3 text-xs outline-none focus:border-solarOrange text-slate-700 dark:text-slate-300"
              >
                <option value="All">All Agents</option>
                {agentsList.map(a => (
                  <option key={a.agentId} value={a.agentId}>{a.fullName} ({a.agentId})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setDistrictFilter('All');
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 hover:bg-slate-50 dark:hover:bg-deepBlue-800 py-2.5 text-xs font-bold text-slate-650 dark:text-slate-300 transition-all"
              >
                Clear Active Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table grid panel */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {loading || importLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-solarOrange"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center text-slate-400 py-16 text-sm">No customers registered matching current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-deepBlue-800/40 text-slate-450 uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Customer ID</th>
                  <th className="py-4 px-6">Client Name</th>
                  <th className="py-4 px-6">Mobile / District</th>
                  <th className="py-4 px-6 text-center">Solar kW</th>
                  <th className="py-4 px-6 text-center">Agent</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-deepBlue-800/20 text-slate-700 dark:text-slate-300">
                {filteredCustomers.map((cust) => (
                  <tr key={cust._id || cust.id} className="hover:bg-slate-50/50 dark:hover:bg-deepBlue-850/20 transition-colors">
                    <td className="py-4.5 px-6 font-bold text-slate-900 dark:text-white">{cust.customerId}</td>
                    <td className="py-4.5 px-6 font-semibold">
                      <div className="flex flex-col">
                        <span>{cust.customerName}</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          Aadhaar: XXXX XXXX {cust.aadhaarNumber.slice(-4)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">{cust.mobileNumber}</span>
                        <span className="text-slate-400 font-normal">{cust.district || 'N/A'}, {cust.state || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6 text-center font-bold text-slate-805 dark:text-slate-205">
                      {cust.solarCapacityRequired || 0} kW
                    </td>
                    <td className="py-4.5 px-6 text-center font-medium">
                      {cust.assignedAgent ? (
                        <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md font-semibold">
                          {cust.assignedAgent}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
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
                    <td className="py-4.5 px-6 text-right space-x-1.5 whitespace-nowrap">
                      {/* View Details */}
                      <button
                        onClick={() => handleViewClick(cust)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-deepBlue-800 hover:border-solarOrange text-slate-600 dark:text-slate-400 hover:text-solarOrange hover:bg-solarOrange/5 transition-all"
                        title="View Full Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Edit Details */}
                      <button
                        onClick={() => handleEditClick(cust)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-deepBlue-800 hover:border-solarOrange text-slate-600 dark:text-slate-400 hover:text-solarOrange hover:bg-solarOrange/5 transition-all"
                        title="Edit Details"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete (Admin Only) */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(cust)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-deepBlue-800 hover:border-red-500 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        customerToEdit={selectedCustomer}
      />

      {/* Customer Details view modal */}
      <CustomerDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default CustomerList;
