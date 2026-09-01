'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw, RefreshCw, LogIn, ShieldCheck, Terminal, ChevronDown, ChevronUp, Wallet } from 'lucide-react';

interface BidderErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BidderErrorBoundary({ error, reset }: BidderErrorProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    console.error('[Bidder Console Route Error Boundary Caught]:', error);
  }, [error]);

  const handleHardResync = () => {
    window.location.reload();
  };

  const handleReturnToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Dynamic ambient background glows */}
      <div className="absolute top-1/4 -left-28 w-96 h-96 bg-seep-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-28 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Main Glassmorphic Error Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/40 shadow-2xl relative overflow-hidden">
          {/* Header & Status Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono uppercase tracking-wider mb-1 font-bold">
                Investor Console Exception Intercepted
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
                Live Bidding Console Interrupted
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                A rendering or synchronization fault was isolated by the route error boundary.
              </p>
            </div>
          </div>

          {/* Wallet & Ledger State Reassurance Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-display uppercase tracking-wider block text-emerald-300 mb-0.5">
                Financial State & Ledger Conserved
              </span>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                Your team purse, active escrow locks, and winning bids are safe on the server. No duplicate deductions or lost transactions can occur.
              </p>
            </div>
          </div>

          {/* Error Message Summary Box */}
          <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-800 text-xs font-mono text-rose-300 mb-6 break-words">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-1">
              Isolated Fault Details
            </div>
            {error?.message || 'Unknown runtime error occurred during bidder UI rendering.'}
            {error?.digest && (
              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                Error Digest: <span className="text-gold-400">{error.digest}</span>
              </div>
            )}
          </div>

          {/* Recovery Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-navy-950 font-display font-black text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg transition flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-gold-400 outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Render</span>
            </button>

            <button
              onClick={handleHardResync}
              className="py-3 px-3 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-700 hover:border-slate-500 text-slate-200 font-display font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-gold-400 outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gold-400" />
              <span>Resync State</span>
            </button>

            <button
              onClick={handleReturnToLogin}
              className="py-3 px-3 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-700 hover:border-slate-500 text-slate-300 font-display font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-gold-400 outline-none"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Re-Authenticate</span>
            </button>
          </div>

          {/* Collapsible Diagnostics Section */}
          <div className="mt-6 pt-4 border-t border-navy-800/80">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition focus-visible:ring-2 focus-visible:ring-gold-400 outline-none py-1"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-gold-400" />
                <span>Diagnostic Telemetry & Trace</span>
              </div>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDiagnostics && (
              <div className="mt-3 p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-[11px] font-mono text-slate-400 max-h-48 overflow-y-auto space-y-2">
                <div>
                  <span className="text-slate-500">Timestamp:</span> {new Date().toISOString()}
                </div>
                <div>
                  <span className="text-slate-500">Error Name:</span> {error?.name || 'Error'}
                </div>
                <div>
                  <span className="text-slate-500">Message:</span> {error?.message}
                </div>
                {error?.digest && (
                  <div>
                    <span className="text-slate-500">Digest:</span> {error.digest}
                  </div>
                )}
                {error?.stack && (
                  <div>
                    <span className="text-slate-500">Stack Trace:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-[10px] text-slate-500">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Brand footer */}
        <div className="text-center text-[11px] text-slate-500">
          SEEP 4.0 Investor Protection · Real-Time Resilient State Recovery
        </div>
      </div>
    </div>
  );
}
