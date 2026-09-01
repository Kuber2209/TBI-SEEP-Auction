'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Sliders,
  LogIn,
  ShieldAlert,
  Terminal,
  ChevronDown,
  ChevronUp,
  Activity,
  ServerCrash,
} from 'lucide-react';

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminErrorBoundary({ error, reset }: AdminErrorProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    console.error('[Operator Command Center Route Error Boundary Captured]:', error);
  }, [error]);

  const handleForceResync = () => {
    window.location.reload();
  };

  const handleAdminReset = () => {
    window.location.href = '/admin';
  };

  const handleReturnToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-28 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-28 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl z-10 space-y-6">
        {/* Main Panel */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/50 shadow-2xl relative overflow-hidden">
          {/* Header & Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
              <ServerCrash className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono uppercase tracking-wider mb-1 font-bold">
                Operator Console Runtime Exception
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
                Command Center Interrupted
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                An isolated UI fault occurred in the Admin Command Center. Live database transactions continue safely.
              </p>
            </div>
          </div>

          {/* Critical Operational Status Notice */}
          <div className="mb-6 p-4 rounded-2xl bg-navy-900/90 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-3">
            <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-display uppercase tracking-wider block text-amber-300 mb-0.5">
                Backend Real-Time State Integrity
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                The PostgreSQL database, realtime channels, and escrow balances are untouched. Use the operator recovery tools below to re-establish live stage telemetry.
              </p>
            </div>
          </div>

          {/* Fault Summary Display */}
          <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 text-xs font-mono text-rose-300 mb-6 break-words">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-1">
              Captured Exception Details
            </div>
            {error?.message || 'Uncaught operator dashboard runtime exception.'}
            {error?.digest && (
              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                Digest: <span className="text-gold-400">{error.digest}</span>
              </div>
            )}
          </div>

          {/* Operator Recovery Tools Grid */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operator Recovery Actions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => reset()}
                className="py-3 px-3 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-navy-950 font-display font-black text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg transition flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-gold-400 outline-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Render</span>
              </button>

              <button
                onClick={handleForceResync}
                className="py-3 px-3 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-700 hover:border-slate-500 text-slate-200 font-display font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-gold-400 outline-none"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gold-400" />
                <span>Force Resync</span>
              </button>

              <button
                onClick={handleAdminReset}
                className="py-3 px-3 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-700 hover:border-slate-500 text-slate-300 font-display font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-gold-400 outline-none"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Admin</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Inspection Section */}
          <div className="mt-6 pt-4 border-t border-navy-800/80">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition focus-visible:ring-2 focus-visible:ring-gold-400 outline-none py-1"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-gold-400" />
                <span>Operator Diagnostic Stack Trace</span>
              </div>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDiagnostics && (
              <div className="mt-3 p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-[11px] font-mono text-slate-400 max-h-48 overflow-y-auto space-y-2">
                <div>
                  <span className="text-slate-500">Timestamp:</span> {new Date().toISOString()}
                </div>
                <div>
                  <span className="text-slate-500">Exception:</span> {error?.name || 'Error'}
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
                    <span className="text-slate-500">Stack:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-[10px] text-slate-500">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* System Operator Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
          <span>SEEP 4.0 Operator Telemetry Protection</span>
          <button
            onClick={handleReturnToLogin}
            className="text-slate-400 hover:text-gold-400 transition underline underline-offset-2"
          >
            Switch Operator / Login
          </button>
        </div>
      </div>
    </div>
  );
}
