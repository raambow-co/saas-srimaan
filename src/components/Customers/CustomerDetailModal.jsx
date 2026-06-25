import React from 'react';
import { X, Calendar, User, Phone, MapPin, Zap, Receipt, Download, FileText, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { BACKEND_URL } from '../../utils/api.js';

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  if (!isOpen || !customer) return null;

  const maskAadhaar = (num) => {
    if (!num || num.length !== 12) return 'N/A';
    return `XXXX XXXX ${num.slice(-4)}`;
  };

  const getDocUrl = (path) => {
    if (!path) return null;
    return `${BACKEND_URL}/${path.replace(/^\.\//, '')}`;
  };

  // Generate and Download customer record as PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Title & Brand
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 140, 0); // Solar Orange
    doc.text('SRIMAAN SOLAR', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Customer Registration Summary Record', 14, 26);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 20);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 30, 196, 30);

    // Customer Identity Summary
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Deep Blue
    doc.text('Customer Identification Info', 14, 40);

    const infoTable = [
      ['Customer ID', customer.customerId, 'Registration Date', new Date(customer.createdAt).toLocaleDateString()],
      ['Full Name', customer.customerName, 'Mobile Number', customer.mobileNumber],
      ['Aadhaar Number', maskAadhaar(customer.aadhaarNumber), 'Assigned Agent', customer.assignedAgent || 'Unassigned'],
      ['Status', customer.status, '', '']
    ];

    doc.autoTable({
      startY: 45,
      body: infoTable,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 40 },
        1: { width: 55 },
        2: { fontStyle: 'bold', width: 40 },
        3: { width: 55 }
      }
    });

    // Technical Requirement Specs
    doc.setFontSize(14);
    doc.text('Solar Installation Requirements', 14, doc.lastAutoTable.finalY + 12);

    const techTable = [
      ['Solar Capacity Required (kW)', `${customer.solarCapacityRequired} kW`],
      ['Monthly Electricity Bill Amount', `Rs. ${customer.electricityBillAmount} /-`]
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 17,
      body: techTable,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 10, cellPadding: 4 }
    });

    // Address Details
    doc.setFontSize(14);
    doc.text('Installation Address coordinates', 14, doc.lastAutoTable.finalY + 12);

    const addrTable = [
      ['House Number (D.No)', customer.houseNumber || 'N/A'],
      ['Village / Locality', customer.village || 'N/A'],
      ['Mandal', customer.mandal || 'N/A'],
      ['District / State', `${customer.district || 'N/A'}, ${customer.state || 'N/A'}`],
      ['Pincode', customer.pincode || 'N/A'],
      ['Full Address details', customer.fullAddress || 'N/A']
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 17,
      body: addrTable,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3.5 }
    });

    // Footer signature notice
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer generated summary transcript. Srimaan Solar Agent Management System.', 14, 280);

    doc.save(`srimaan_customer_${customer.customerId}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200/60 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 shadow-2xl overflow-hidden relative my-8 animate-slide-up">
        {/* Orange Glow Stripe */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-solarOrange to-orange-500"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-deepBlue-800/80 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Customer Profile: {customer.customerName}
              <span className="text-xs font-bold text-solarOrange bg-solarOrange/10 px-2 py-0.5 rounded-full">
                {customer.customerId}
              </span>
            </h3>
            <p className="text-xs text-slate-450">Created on {new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1 bg-solarOrange hover:bg-solarOrange-hover text-white py-1.5 px-3.5 rounded-xl text-xs font-bold shadow-md shadow-solarOrange/10 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-deepBlue-800/80 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Info Blocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1: Core details */}
            <div className="md:col-span-2 space-y-4 bg-slate-50/50 dark:bg-deepBlue-950/20 border border-slate-100 dark:border-deepBlue-850/40 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="h-4 w-4 text-solarOrange" />
                Customer Identity File
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Mobile Number:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {customer.mobileNumber}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Aadhaar Card:</span>
                  <p className="font-semibold text-slate-850 dark:text-slate-200 mt-0.5">{maskAadhaar(customer.aadhaarNumber)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Assigned Agent:</span>
                  <p className="font-semibold text-slate-850 dark:text-slate-200 mt-0.5">{customer.assignedAgent || 'Unassigned'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Current Lead Status:</span>
                  <p className="mt-0.5">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 font-bold text-[10px] bg-solarOrange/10 text-solarOrange">
                      {customer.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Box 2: Solar Technical Info */}
            <div className="space-y-4 bg-solarOrange/5 border border-solarOrange/10 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-solarOrange uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-solarOrange" />
                Solar Energy Specs
              </h4>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Capacity Requested:</span>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-1 mt-0.5">
                    {customer.solarCapacityRequired || 0} kW
                  </p>
                </div>
                <div className="border-t border-solarOrange/10 pt-2.5">
                  <span className="text-slate-500 dark:text-slate-400">Electricity Bill (monthly):</span>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-1 mt-0.5">
                    Rs. {customer.electricityBillAmount || 0} /-
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="bg-slate-50/50 dark:bg-deepBlue-950/20 border border-slate-100 dark:border-deepBlue-850/40 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-solarOrange" />
              Installation Address Coordinates
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div>
                <span className="text-slate-400">House No (D.No):</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{customer.houseNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Village:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{customer.village || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Mandal:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{customer.mandal || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">District:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{customer.district || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">State / Pincode:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {customer.state || 'N/A'} - {customer.pincode || 'N/A'}
                </p>
              </div>
            </div>

            {customer.fullAddress && (
              <div className="border-t border-slate-200/50 dark:border-deepBlue-850/30 pt-3.5 mt-3.5 text-xs">
                <span className="text-slate-400">Full Street Details:</span>
                <p className="font-medium text-slate-700 dark:text-slate-350 mt-1 leading-relaxed">{customer.fullAddress}</p>
              </div>
            )}
          </div>

          {/* Document Store grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Document Storage Repository
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Photo Card */}
              <div className="border border-slate-200/60 dark:border-deepBlue-800 bg-slate-50/20 dark:bg-deepBlue-900/40 rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[140px]">
                <FileText className="h-7 w-7 text-solarOrange mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-250">Customer Photo</span>
                {customer.customerPhoto ? (
                  <a
                    href={getDocUrl(customer.customerPhoto)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-solarOrange hover:underline mt-2.5 bg-solarOrange/10 rounded-lg px-2.5 py-1"
                  >
                    <Download className="h-3 w-3" />
                    Download Photo
                  </a>
                ) : (
                  <span className="text-[10px] text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 rounded-lg px-2 py-0.5 mt-2.5">
                    File Pending
                  </span>
                )}
              </div>

              {/* Aadhaar Front Card */}
              <div className="border border-slate-200/60 dark:border-deepBlue-800 bg-slate-50/20 dark:bg-deepBlue-900/40 rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[140px]">
                <FileText className="h-7 w-7 text-solarOrange mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-250">Aadhaar Card Front</span>
                {customer.aadhaarFront ? (
                  <a
                    href={getDocUrl(customer.aadhaarFront)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-solarOrange hover:underline mt-2.5 bg-solarOrange/10 rounded-lg px-2.5 py-1"
                  >
                    <Download className="h-3 w-3" />
                    Download Aadhaar
                  </a>
                ) : (
                  <span className="text-[10px] text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 rounded-lg px-2 py-0.5 mt-2.5">
                    File Pending
                  </span>
                )}
              </div>

              {/* Aadhaar Back Card */}
              <div className="border border-slate-200/60 dark:border-deepBlue-800 bg-slate-50/20 dark:bg-deepBlue-900/40 rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[140px]">
                <FileText className="h-7 w-7 text-solarOrange mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-250">Aadhaar Card Back</span>
                {customer.aadhaarBack ? (
                  <a
                    href={getDocUrl(customer.aadhaarBack)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-solarOrange hover:underline mt-2.5 bg-solarOrange/10 rounded-lg px-2.5 py-1"
                  >
                    <Download className="h-3 w-3" />
                    Download Aadhaar
                  </a>
                ) : (
                  <span className="text-[10px] text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 rounded-lg px-2 py-0.5 mt-2.5">
                    File Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Activity Logs Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
              Audit Progress Timeline
            </h4>
            <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
              {customer.activityHistory?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center">No logs recorded.</p>
              ) : (
                customer.activityHistory?.slice().reverse().map((act, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {act.action.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{act.notes}</p>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">
                        by {act.performedBy}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
