'use client';

import React, { useState } from 'react';
import { loginWithUserId } from '@/lib/auth/actions';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Lock, User, Sparkles, ArrowRight, ShieldCheck, AlertCircle, KeyRound, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userIdVal, setUserIdVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginWithUserId(null, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const fillQuickCredentials = (id: string, pass: string) => {
    setUserIdVal(id);
    setPasswordVal(pass);
  };

  return (
    <ErrorBoundary fallbackTitle="Authentication Interface Error">
      <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Banner */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-navy-850 border border-white/[0.07] mb-4">
            <Building2 className="w-6 h-6 text-gold-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight text-balance">
            SEEP <span className="text-gold-500">4.0</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mt-1">
            Student Entrepreneurs Encouragement Program
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Technology Business Incubator · BITS Pilani Hyderabad Campus
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-panel rounded-[16px] p-7 sm:p-9 border border-white/[0.07] shadow-sm relative overflow-hidden">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white tracking-tight text-balance">
              Live Auction Console Access
            </h2>
            <p className="text-xs text-slate-400 mt-1 text-pretty">
              Enter your pre-assigned team credentials to enter the live room.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-[12px] bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
                Team User ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" strokeWidth={1.75} />
                <input
                  type="text"
                  name="userId"
                  required
                  value={userIdVal}
                  onChange={(e) => setUserIdVal(e.target.value)}
                  placeholder="e.g. TEAM01 or ADMIN01"
                  autoCapitalize="characters"
                  className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-navy-950/50 border border-white/[0.07] text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors duration-150"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" strokeWidth={1.75} />
                <input
                  type="password"
                  name="password"
                  required
                  value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-navy-950/50 border border-white/[0.07] text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors duration-150"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-[12px] bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Live Auction'}</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </form>

          {/* Quick Demo Rehearsal Helpers */}
          <div className="mt-6 pt-5 border-t border-white/[0.07]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2 text-center">
              Rehearsal Quick Credentials
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillQuickCredentials('ADMIN01', 'AdminPassword123!')}
                className="p-2 rounded-[8px] bg-navy-900 hover:bg-navy-850 border border-white/[0.07] text-gold-400 text-center transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <KeyRound className="w-3.5 h-3.5" strokeWidth={1.75} /> Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('TEAM01', 'PassTEAM01#2026')}
                className="p-2 rounded-[8px] bg-navy-900 hover:bg-navy-850 border border-white/[0.07] text-blue-400 text-center transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Team 01
              </button>
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="mt-5 pt-4 border-t border-white/[0.07]/60 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Single-Device Session Encryption Active</span>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
