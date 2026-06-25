import React, { useState, useEffect } from 'react';
import { X, Upload, Loader, CheckCircle } from 'lucide-react';
import API from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import AadhaarVerifier from './AadhaarVerifier.jsx';

const CustomerFormModal = ({ isOpen, onClose, onSave, customerToEdit = null }) => {
  const { isAdmin, user } = useAuth();
  
  const [customerName, setCustomerName] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('');
  const [solarCapacityRequired, setSolarCapacityRequired] = useState('');
  const [electricityBillAmount, setElectricityBillAmount] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('');
  const [status, setStatus] = useState('New Lead');

  // File Upload states
  const [customerPhotoFile, setCustomerPhotoFile] = useState(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);

  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Aadhaar Mock Verification States
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [showVerifier, setShowVerifier] = useState(false);

  const isEditMode = !!customerToEdit;

  useEffect(() => {
    // If Admin, load agents list for assignment dropdown
    if (isAdmin && isOpen) {
      const fetchAgents = async () => {
        try {
          const res = await API.get('/agents');
          setAgentsList(res.data.filter(a => a.status === 'Active'));
        } catch (e) {
          console.error('Failed to load agents list for assignments:', e);
        }
      };
      fetchAgents();
    }
  }, [isAdmin, isOpen]);

  useEffect(() => {
    if (customerToEdit) {
      setCustomerName(customerToEdit.customerName || '');
      setAadhaarNumber(customerToEdit.aadhaarNumber || '');
      setMobileNumber(customerToEdit.mobileNumber || '');
      setHouseNumber(customerToEdit.houseNumber || '');
      setFullAddress(customerToEdit.fullAddress || '');
      setVillage(customerToEdit.village || '');
      setMandal(customerToEdit.mandal || '');
      setDistrict(customerToEdit.district || '');
      setState(customerToEdit.state || 'Andhra Pradesh');
      setPincode(customerToEdit.pincode || '');
      setSolarCapacityRequired(customerToEdit.solarCapacityRequired || '');
      setElectricityBillAmount(customerToEdit.electricityBillAmount || '');
      setAssignedAgent(customerToEdit.assignedAgent || '');
      setStatus(customerToEdit.status || 'New Lead');
      setIsAadhaarVerified(true); // Pre-verified if editing
    } else {
      setCustomerName('');
      setAadhaarNumber('');
      setMobileNumber('');
      setHouseNumber('');
      setFullAddress('');
      setVillage('');
      setMandal('');
      setDistrict('');
      setState('Andhra Pradesh');
      setPincode('');
      setSolarCapacityRequired('');
      setElectricityBillAmount('');
      setAssignedAgent('');
      setStatus('New Lead');
      setCustomerPhotoFile(null);
      setAadhaarFrontFile(null);
      setAadhaarBackFile(null);
      setIsAadhaarVerified(false);
    }
    setError('');
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !aadhaarNumber || !mobileNumber) {
      setError('Name, Aadhaar Number, and Mobile Number are required.');
      return;
    }

    if (!isAadhaarVerified) {
      setError('Please run Aadhaar Verification before saving.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Save text fields
      const payload = {
        customerName,
        aadhaarNumber,
        mobileNumber,
        houseNumber,
        fullAddress,
        village,
        mandal,
        district,
        state,
        pincode,
        solarCapacityRequired: Number(solarCapacityRequired) || 0,
        electricityBillAmount: Number(electricityBillAmount) || 0,
        assignedAgent: isAdmin ? assignedAgent : user.agentId,
        status
      };

      let savedCustomer;
      if (isEditMode) {
        const res = await API.put(`/customers/${customerToEdit._id || customerToEdit.id}`, payload);
        savedCustomer = res.data;
      } else {
        const res = await API.post('/customers', payload);
        savedCustomer = res.data;
      }

      // 2. Upload documents if files are selected
      if (customerPhotoFile || aadhaarFrontFile || aadhaarBackFile) {
        const formData = new FormData();
        if (customerPhotoFile) formData.append('customerPhoto', customerPhotoFile);
        if (aadhaarFrontFile) formData.append('aadhaarFront', aadhaarFrontFile);
        if (aadhaarBackFile) formData.append('aadhaarBack', aadhaarBackFile);

        const uploadRes = await API.post(`/customers/${savedCustomer._id || savedCustomer.id}/upload-docs`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        savedCustomer = uploadRes.data;
      }

      onSave(savedCustomer);
      onClose();
    } catch (err) {
      console.error('Save customer error:', err);
      setError(err.response?.data?.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAadhaar = () => {
    if (aadhaarNumber.length !== 12 || isNaN(Number(aadhaarNumber))) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setError('');
    setShowVerifier(true);
  };

  const handleAadhaarVerificationComplete = (success) => {
    setShowVerifier(false);
    if (success) {
      setIsAadhaarVerified(true);
    } else {
      setError('Aadhaar digits check failed. Verification rejected.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200/60 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 shadow-2xl overflow-hidden relative my-8 animate-slide-up">
        {/* Glow Line Top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-solarOrange to-orange-500"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-deepBlue-800/80 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {isEditMode ? `Edit Customer: ${customerToEdit.customerName}` : 'Add New Customer'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-deepBlue-800/80 hover:text-slate-600 dark:hover:text-slate-250 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-800/20 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Section 1: Customer details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Personal Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="Ramesh Rao"
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
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>

            {/* Aadhaar Input with verification button */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Aadhaar Number (12 digits) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => {
                      setAadhaarNumber(e.target.value);
                      setIsAadhaarVerified(false); // require re-verification on change
                    }}
                    disabled={isEditMode}
                    className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100 disabled:opacity-60"
                    placeholder="123456789012"
                    required
                  />
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={handleVerifyAadhaar}
                      className={`rounded-xl px-4 text-xs font-bold transition-all shrink-0 ${
                        isAadhaarVerified
                          ? 'bg-green-500 text-white flex items-center gap-1 cursor-default shadow-md shadow-green-500/10'
                          : 'bg-solarOrange text-white hover:bg-solarOrange-hover shadow-md shadow-solarOrange/10'
                      }`}
                    >
                      {isAadhaarVerified ? <CheckCircle className="h-4 w-4" /> : 'Verify'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Solar Capacity Required (kW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={solarCapacityRequired}
                  onChange={(e) => setSolarCapacityRequired(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="3.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Monthly Electricity Bill Amount (Rs.)
                </label>
                <input
                  type="number"
                  value={electricityBillAmount}
                  onChange={(e) => setElectricityBillAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="2500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-950/40 py-2.5 px-3 text-sm outline-none focus:border-solarOrange transition-all text-slate-850 dark:text-slate-100"
                >
                  {['New Lead', 'In Progress', 'Site Inspection', 'Document Verification', 'Approved', 'Installation Pending', 'Installed', 'Rejected'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
          <div className="space-y-4 border-t border-slate-100 dark:border-deepBlue-800/40 pt-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Installation Address
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  House Number (D.No)
                </label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="Door No. 12-3"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Village
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="Gopalapuram"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Mandal
                </label>
                <input
                  type="text"
                  value={mandal}
                  onChange={(e) => setMandal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="Pamarru"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="Krishna"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="Andhra Pradesh"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                  placeholder="521157"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Street Address
              </label>
              <textarea
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-2.5 px-3.5 text-sm outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all text-slate-850 dark:text-slate-100"
                placeholder="Main Road near Temple..."
              />
            </div>
          </div>

          {/* Section 3: Admin Only - Agent Assignment */}
          {isAdmin && (
            <div className="space-y-4 border-t border-slate-100 dark:border-deepBlue-800/40 pt-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Agent Assignment
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Assign Agent
                  </label>
                  <select
                    value={assignedAgent}
                    onChange={(e) => setAssignedAgent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-950/40 py-2.5 px-3 text-sm outline-none focus:border-solarOrange transition-all text-slate-850 dark:text-slate-100"
                  >
                    <option value="">-- Unassigned --</option>
                    {agentsList.map((agent) => (
                      <option key={agent.agentId} value={agent.agentId}>
                        {agent.fullName} ({agent.agentId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: File Uploads */}
          <div className="space-y-4 border-t border-slate-100 dark:border-deepBlue-800/40 pt-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Document Uploads
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-deepBlue-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-deepBlue-950/10 text-center relative hover:bg-slate-50 transition-colors">
                <Upload className="h-6 w-6 text-slate-400 mb-2" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350">Customer Photo</span>
                <span className="text-[9px] text-slate-400 mt-1 max-w-[120px] truncate">
                  {customerPhotoFile ? customerPhotoFile.name : 'Select JPG/PNG'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCustomerPhotoFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Aadhaar Front */}
              <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-deepBlue-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-deepBlue-950/10 text-center relative hover:bg-slate-50 transition-colors">
                <Upload className="h-6 w-6 text-slate-400 mb-2" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350">Aadhaar Front</span>
                <span className="text-[9px] text-slate-400 mt-1 max-w-[120px] truncate">
                  {aadhaarFrontFile ? aadhaarFrontFile.name : 'Select JPG/PNG/PDF'}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setAadhaarFrontFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Aadhaar Back */}
              <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-deepBlue-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-deepBlue-950/10 text-center relative hover:bg-slate-50 transition-colors">
                <Upload className="h-6 w-6 text-slate-400 mb-2" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350">Aadhaar Back</span>
                <span className="text-[9px] text-slate-400 mt-1 max-w-[120px] truncate">
                  {aadhaarBackFile ? aadhaarBackFile.name : 'Select JPG/PNG/PDF'}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setAadhaarBackFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-deepBlue-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-deepBlue-800 hover:bg-slate-50 dark:hover:bg-deepBlue-850 text-slate-500 py-2.5 px-5 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-solarOrange hover:bg-solarOrange-hover text-white py-2.5 px-5 text-xs font-bold transition-all shadow-md shadow-solarOrange/25 flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : (isEditMode ? 'Update Client' : 'Add Client')}
            </button>
          </div>
        </form>
      </div>

      {/* Aadhaar Verifier Modal Overlay */}
      {showVerifier && (
        <AadhaarVerifier
          aadhaarNumber={aadhaarNumber}
          onComplete={handleAadhaarVerificationComplete}
        />
      )}
    </div>
  );
};

export default CustomerFormModal;
