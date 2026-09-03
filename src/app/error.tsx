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
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Error Container Card */}
        <div className="glass-panel rounded-[24px] p-6 sm:p-8 border border-rose-500/40 shadow-sm relative overflow-hidden">
          {/* Header Badge & Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-[16px] bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono uppercase tracking-wider mb-1 font-bold">
                Root Exception Intercepted
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Application Rendering Exception
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                The global runtime caught an unhandled exception. Platform state integrity remains secured.
              </p>
            </div>
          </div>

          {/* Primary Error Message Summary */}
          <div className="p-4 rounded-[16px] bg-navy-900/90 border border-white/[0.07] text-xs font-mono text-rose-300 mb-6 break-words">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-1">
              Error Summary
            </div>
            {error?.message || 'An unexpected runtime fault occurred in the application layer.'}
            {error?.digest && (
              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                Digest Code: <span className="text-gold-400">{error.digest}</span>
              </div>
            )}
          </div>

          {/* Action Recovery Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="py-3 px-4 rounded-[12px] bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-navy-950 font-semibold text-xs uppercase tracking-wider shadow-sm hover:shadow-sm transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-gold-400 outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Render Attempt</span>
            </button>

            <button
              onClick={handleNavigationReset}
              className="py-3 px-4 rounded-[12px] bg-navy-850 hover:bg-navy-800 border border-navy-700 hover:border-slate-500 text-slate-200 font-display font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-gold-400 outline-none"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>Reset & Return Home</span>
            </button>
          </div>

          {/* Collapsible Diagnostics */}
          <div className="mt-6 pt-4 border-t border-white/[0.07]">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition focus-visible:ring-2 focus-visible:ring-gold-400 outline-none py-1"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-gold-400" />
                <span>Technical Diagnostic Details</span>
              </div>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="mt-3 p-3.5 rounded-[12px] bg-navy-950 border border-white/[0.07] text-[11px] font-mono text-slate-400 max-h-48 overflow-y-auto space-y-2">
                <div>
                  <span className="text-slate-500">Name:</span> {error?.name || 'Error'}
                </div>
                <div>
                  <span className="text-slate-500">Message:</span> {error?.message}
                </div>
                {error?.stack && (
                  <div>
                    <span className="text-slate-500">Stack:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-[10px] text-slate-500">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {error?.digest && (
                  <div>
                    <span className="text-slate-500">Digest:</span> {error.digest}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Security / System Reassurance Note */}
        <div className="text-center text-[11px] text-slate-500">
          SEEP 4.0 Fault-Tolerant Micro-Architecture · BITS Pilani TBI
        </div>
      </div>
    </div>
  );
}
