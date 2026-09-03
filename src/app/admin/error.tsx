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
    <div className="min-h-screen bg-[#f0f5f1] text-[#33404f] flex flex-col justify-center items-center p-4 sm:p-6 relative">
      <div className="w-full max-w-2xl z-10 space-y-6">
        {/* Main Panel */}
        <div className="rounded-xl p-6 sm:p-8 bg-[#f9f8f6] border border-[#e2e5ea] shadow-sm relative overflow-hidden">
          {/* Header & Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
              <ServerCrash className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-[10px] font-mono uppercase tracking-wider mb-1 font-semibold">
                Operator Console Runtime Exception
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#33404f] tracking-tight">
                Command Center Interrupted
              </h1>
              <p className="text-xs text-[#6b7a8d] mt-1">
                An isolated UI fault occurred in the Admin Command Center. Live database transactions continue safely.
              </p>
            </div>
          </div>

          {/* Critical Operational Status Notice */}
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <Activity className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold uppercase tracking-wider block text-amber-900 mb-0.5 text-[11px]">
                Backend Real-Time State Integrity
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                The PostgreSQL database, realtime channels, and escrow balances are untouched. Use the operator recovery tools below to re-establish live stage telemetry.
              </p>
            </div>
          </div>

          {/* Fault Summary Display */}
          <div className="p-4 rounded-lg bg-white border border-[#e2e5ea] text-xs font-mono text-red-700 mb-6 break-words">
            <div className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#6b7a8d] mb-1">
              Captured Exception Details
            </div>
            {error?.message || 'Uncaught operator dashboard runtime exception.'}
            {error?.digest && (
              <div className="mt-2 text-[10px] text-[#6b7a8d] font-mono">
                Digest: <span className="text-[#33404f]">{error.digest}</span>
              </div>
            )}
          </div>

          {/* Operator Recovery Tools Grid */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7a8d]">
              Operator Recovery Actions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => reset()}
                className="py-2.5 px-3 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-white font-semibold text-xs tracking-wider shadow-sm transition flex items-center justify-center gap-1.5 outline-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Render</span>
              </button>

              <button
                onClick={handleForceResync}
                className="py-2.5 px-3 rounded-md bg-white hover:bg-[#f1f4f7] border border-[#e2e5ea] text-[#33404f] font-semibold text-xs tracking-wider transition flex items-center justify-center gap-1.5 outline-none"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#1a5c3e]" />
                <span>Force Resync</span>
              </button>

              <button
                onClick={handleAdminReset}
                className="py-2.5 px-3 rounded-md bg-white hover:bg-[#f1f4f7] border border-[#e2e5ea] text-[#33404f] font-semibold text-xs tracking-wider transition flex items-center justify-center gap-1.5 outline-none"
              >
                <Sliders className="w-3.5 h-3.5 text-[#6b7a8d]" />
                <span>Reset Admin</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Inspection Section */}
          <div className="mt-6 pt-4 border-t border-[#e2e5ea]">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#6b7a8d] hover:text-[#33404f] transition outline-none py-1"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#1a5c3e]" />
                <span>Operator Diagnostic Stack Trace</span>
              </div>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDiagnostics && (
              <div className="mt-3 p-3.5 rounded-lg bg-white border border-[#e2e5ea] text-[11px] font-mono text-[#6b7a8d] max-h-48 overflow-y-auto space-y-2">
                <div>
                  <span className="text-[#6b7a8d]">Timestamp:</span> {new Date().toISOString()}
                </div>
                <div>
                  <span className="text-[#6b7a8d]">Exception:</span> {error?.name || 'Error'}
                </div>
                <div>
                  <span className="text-[#6b7a8d]">Message:</span> {error?.message}
                </div>
                {error?.digest && (
                  <div>
                    <span className="text-[#6b7a8d]">Digest:</span> {error.digest}
                  </div>
                )}
                {error?.stack && (
                  <div>
                    <span className="text-[#6b7a8d]">Stack:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-[10px] text-[#6b7a8d]">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* System Operator Footer */}
        <div className="flex items-center justify-between text-[11px] text-[#6b7a8d] px-2">
          <span>SEEP 4.0 Operator Telemetry Protection</span>
          <button
            onClick={handleReturnToLogin}
            className="text-[#6b7a8d] hover:text-[#1a5c3e] transition underline underline-offset-2"
          >
            Switch Operator / Login
          </button>
        </div>
      </div>
    </div>
  );
}
