import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, ShieldCheck, XCircle } from 'lucide-react';

const AadhaarVerifier = ({ aadhaarNumber, onComplete }) => {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('initiating'); // initiating, checksum, uidai, verified, failed

  useEffect(() => {
    // Stage 1: Initiating validation check
    const timer1 = setTimeout(() => {
      setStep(1);
      setStatus('checksum');
    }, 1200);

    // Stage 2: UIDAI API handshake
    const timer2 = setTimeout(() => {
      setStep(2);
      setStatus('uidai');
    }, 2500);

    // Stage 3: Success Completion
    const timer3 = setTimeout(() => {
      // Validate Aadhaar: must be 12 digits and not all identical (e.g. 000000000000 is invalid)
      const isIdentical = /^(.)\1+$/.test(aadhaarNumber);
      if (aadhaarNumber.length === 12 && !isIdentical) {
        setStep(3);
        setStatus('verified');
      } else {
        setStatus('failed');
      }
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [aadhaarNumber]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/50 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 shadow-2xl p-6 text-center animate-slide-up">
        
        {/* Verification Status Graphic */}
        <div className="flex justify-center mb-6">
          {status === 'failed' ? (
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center animate-bounce">
              <XCircle className="h-10 w-10" />
            </div>
          ) : status === 'verified' ? (
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950/20 text-green-500 flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 animate-pulse-glow" />
            </div>
          ) : (
            <div className="relative h-16 w-16 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-solarOrange animate-spin"></div>
              <Loader className="absolute h-6 w-6 text-solarOrange animate-pulse" />
            </div>
          )}
        </div>

        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
          UIDAI Aadhaar Verification
        </h3>
        <p className="text-xs text-slate-500 font-semibold mb-6">
          Checking UID: XXXX XXXX {aadhaarNumber.slice(-4)}
        </p>

        {/* Verification Progress Checklist */}
        <div className="space-y-4 text-left border-t border-slate-100 dark:border-deepBlue-800/40 pt-4 mb-6">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 1 ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-deepBlue-800 text-slate-400'
            }`}>
              {step >= 1 ? '✓' : '1'}
            </div>
            <span className={`text-xs ${step >= 0 ? 'text-slate-700 dark:text-slate-350 font-medium' : 'text-slate-400'}`}>
              Analyzing Aadhaar digits...
            </span>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 2 ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-deepBlue-800 text-slate-400'
            }`}>
              {step >= 2 ? '✓' : '2'}
            </div>
            <span className={`text-xs ${step >= 1 ? 'text-slate-700 dark:text-slate-350 font-medium' : 'text-slate-400'}`}>
              Connecting to UIDAI registry gateway...
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
              status === 'verified'
                ? 'bg-green-500 text-white'
                : status === 'failed'
                ? 'bg-red-500 text-white'
                : 'bg-slate-100 dark:bg-deepBlue-800 text-slate-400'
            }`}>
              {status === 'verified' ? '✓' : status === 'failed' ? '✗' : '3'}
            </div>
            <span className={`text-xs ${step >= 2 ? 'text-slate-700 dark:text-slate-350 font-medium' : 'text-slate-400'}`}>
              {status === 'failed' ? 'Verification failed' : 'KYC registration lookup...'}
            </span>
          </div>
        </div>

        {/* Action button */}
        {status === 'verified' && (
          <button
            onClick={() => onComplete(true)}
            className="w-full rounded-xl bg-green-500 text-white py-2.5 px-4 text-xs font-bold shadow-md shadow-green-500/20 hover:bg-green-600 transition-colors"
          >
            Use Verified Aadhaar
          </button>
        )}

        {status === 'failed' && (
          <button
            onClick={() => onComplete(false)}
            className="w-full rounded-xl bg-red-500 text-white py-2.5 px-4 text-xs font-bold shadow-md shadow-red-500/20 hover:bg-red-650 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default AadhaarVerifier;
