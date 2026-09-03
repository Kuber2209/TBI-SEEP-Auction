'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  RotateCcw,
  RefreshCw,
  LogIn,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BidderErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BidderError({ error, reset }: BidderErrorProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    console.error('[Bidder Console Error Boundary Captured]:', error);
  }, [error]);

  const handleHardResync = () => {
    window.location.reload();
  };

  const handleReturnToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#dfe7e0] text-[#203126] flex flex-col justify-center items-center p-4 sm:p-6 relative">
      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Main Error Container */}
        <div className="rounded-xl p-6 sm:p-8 bg-[#eff4f0] border border-[#cad7cc] shadow-sm relative overflow-hidden">
          {/* Header & Status Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-[10px] font-mono uppercase tracking-wider mb-1 font-semibold">
                Investor Console Exception Intercepted
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#203126] tracking-tight">
                Live Bidding Console Interrupted
              </h1>
              <p className="text-xs text-[#56695e] mt-1">
                A rendering or synchronization fault was isolated by the route error boundary.
              </p>
            </div>
          </div>

          {/* Wallet & Ledger State Reassurance Banner */}
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold uppercase tracking-wider block text-emerald-900 mb-0.5 text-[11px]">
                Financial State & Ledger Conserved
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Your team purse, active escrow locks, and winning bids are safe on the server. No duplicate deductions or lost transactions can occur.
              </p>
            </div>
          </div>

          {/* Error Message Summary Box */}
          <div className="p-4 rounded-lg bg-[#e5ece6] border border-[#cad7cc] text-xs font-mono text-red-700 mb-6 break-words">
            <div className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#56695e] mb-1">
              Isolated Fault Details
            </div>
            {error?.message || 'Unknown runtime error occurred during bidder UI rendering.'}
            {error?.digest && (
              <div className="mt-2 text-[10px] text-[#56695e] font-mono">
                Error Digest: <span className="text-[#203126]">{error.digest}</span>
              </div>
            )}
          </div>

          {/* Recovery Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="py-2.5 px-3 rounded-md bg-[#1a5c3e] hover:bg-[#144931] text-white font-semibold text-xs tracking-wider shadow-sm transition flex items-center justify-center gap-1.5 outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Render</span>
            </button>

            <button
              onClick={handleHardResync}
              className="py-2.5 px-3 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] border border-[#cad7cc] text-[#203126] font-semibold text-xs tracking-wider transition flex items-center justify-center gap-1.5 outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#1a5c3e]" />
              <span>Resync State</span>
            </button>

            <button
              onClick={handleReturnToLogin}
              className="py-2.5 px-3 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] border border-[#cad7cc] text-[#203126] font-semibold text-xs tracking-wider transition flex items-center justify-center gap-1.5 outline-none"
            >
              <LogIn className="w-3.5 h-3.5 text-[#56695e]" />
              <span>Re-Authenticate</span>
            </button>
          </div>

          {/* Collapsible Diagnostics Section */}
          <div className="mt-6 pt-4 border-t border-[#cad7cc]">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#56695e] hover:text-[#203126] transition outline-none py-1"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#1a5c3e]" />
                <span>Diagnostic Telemetry & Trace</span>
              </div>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDiagnostics && (
              <div className="mt-3 p-3.5 rounded-lg bg-[#e5ece6] border border-[#cad7cc] text-[11px] font-mono text-[#56695e] max-h-48 overflow-y-auto space-y-2">
                <div>
                  <span className="text-[#56695e]">Timestamp:</span> {new Date().toISOString()}
                </div>
                <div>
                  <span className="text-[#56695e]">Error Name:</span> {error?.name || 'Error'}
                </div>
                <div>
                  <span className="text-[#56695e]">Message:</span> {error?.message}
                </div>
                {error?.digest && (
                  <div>
                    <span className="text-[#56695e]">Digest:</span> {error.digest}
                  </div>
                )}
                {error?.stack && (
                  <div>
                    <span className="text-[#56695e]">Stack Trace:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-[10px] text-[#56695e]">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Brand footer */}
        <div className="text-center text-[11px] text-[#56695e]">
          SEEP 4.0 Investor Protection · Real-Time Resilient State Recovery
        </div>
      </div>
    </div>
  );
}
