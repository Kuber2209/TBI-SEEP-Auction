'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Home, ShieldAlert, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('[Root App Router Error Boundary Captured]:', error);
  }, [error]);

  const handleNavigationReset = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#dfe7e0] text-[#203126] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Error Container Card */}
        <div className="bg-[#eff4f0] rounded-xl p-6 sm:p-8 border border-[#cad7cc] shadow-sm relative overflow-hidden">
          {/* Header Badge & Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-[10px] font-mono uppercase tracking-wider mb-1 font-semibold">
                Root Exception Intercepted
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#203126] tracking-tight">
                Application Rendering Exception
              </h1>
              <p className="text-xs text-[#56695e] mt-1">
                The global runtime caught an unhandled exception. Platform state integrity remains secured.
              </p>
            </div>
          </div>

          {/* Primary Error Message Summary */}
          <div className="p-4 rounded-lg bg-[#e5ece6] border border-[#cad7cc] text-xs font-mono text-[#203126] mb-6 break-words">
            <div className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#56695e] mb-1">
              Error Summary
            </div>
            {error?.message || 'An unexpected runtime fault occurred in the application layer.'}
            {error?.digest && (
              <div className="mt-2 text-[10px] text-[#56695e] font-mono">
                Digest Code: <span className="text-[#1a5c3e] font-semibold">{error.digest}</span>
              </div>
            )}
          </div>

          {/* Action Recovery Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="py-2.5 px-4 rounded-md bg-[#1a5c3e] hover:bg-[#144931] text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Render Attempt</span>
            </button>

            <button
              onClick={handleNavigationReset}
              className="py-2.5 px-4 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] border border-[#cad7cc] text-[#203126] font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4 text-[#56695e]" />
              <span>Reset & Return Home</span>
            </button>
          </div>

          {/* Collapsible Diagnostics */}
          <div className="mt-6 pt-4 border-t border-[#cad7cc]">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-xs font-medium text-[#56695e] hover:text-[#203126] transition py-1"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#1a5c3e]" />
                <span>Technical Diagnostic Details</span>
              </div>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="mt-3 p-3.5 rounded-lg bg-[#e5ece6] border border-[#cad7cc] text-[11px] font-mono text-[#203126] max-h-48 overflow-y-auto space-y-2">
                <div>
                  <span className="text-[#56695e]">Name:</span> {error?.name || 'Error'}
                </div>
                <div>
                  <span className="text-[#56695e]">Message:</span> {error?.message}
                </div>
                {error?.stack && (
                  <div>
                    <span className="text-[#56695e]">Stack:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-[10px] text-[#56695e]">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {error?.digest && (
                  <div>
                    <span className="text-[#56695e]">Digest:</span> {error.digest}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Security / System Reassurance Note */}
        <div className="text-center text-[11px] text-[#56695e]">
          SEEP 4.0 Fault-Tolerant Micro-Architecture · BITS Pilani TBI
        </div>
      </div>
    </div>
  );
}
