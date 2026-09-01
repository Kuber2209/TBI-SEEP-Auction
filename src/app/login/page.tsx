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
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 -left-28 w-96 h-96 bg-seep-blue/15 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -right-28 w-96 h-96 bg-gold-500/12 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Banner */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-gold-600 via-gold-500 to-amber-300 text-navy-950 font-display font-black text-3xl sm:text-4xl shadow-gold-lg mb-4 transform hover:scale-105 transition">
            S
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
            SEEP <span className="text-gold-500">4.0</span>
          </h1>
          <p className="text-xs font-black uppercase tracking-widest text-gold-400 mt-1">
            Student Entrepreneurs Encouragement Program
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Technology Business Incubator · BITS Pilani Hyderabad Campus
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-panel rounded-3xl p-7 sm:p-9 border border-navy-800/80 shadow-2xl relative overflow-hidden">
          <div className="mb-6">
            <h2 className="text-xl font-display font-black text-white tracking-tight">
              Live Auction Console Access
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your pre-assigned team credentials to enter the live room.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Team User ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  name="userId"
                  required
                  value={userIdVal}
                  onChange={(e) => setUserIdVal(e.target.value)}
                  placeholder="e.g. TEAM01 or ADMIN01"
                  autoCapitalize="characters"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-navy-950/90 border border-navy-700 text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-navy-950/90 border border-navy-700 text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-navy-950 font-display font-black text-sm uppercase tracking-wider shadow-gold hover:shadow-gold-lg transition duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Live Auction'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Rehearsal Helpers */}
          <div className="mt-6 pt-5 border-t border-navy-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center">
              Rehearsal Quick Credentials
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillQuickCredentials('ADMIN01', 'AdminPassword123!')}
                className="p-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-navy-800 text-gold-400 font-mono text-center transition"
              >
                🔑 Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('TEAM01', 'PassTEAM01#2026')}
                className="p-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-navy-800 text-seep-sky font-mono text-center transition"
              >
                💼 Team 01
              </button>
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="mt-5 pt-4 border-t border-navy-800/60 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Single-Device Session Encryption Active</span>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
