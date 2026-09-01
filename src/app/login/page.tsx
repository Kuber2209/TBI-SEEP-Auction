'use client';

import React, { useState } from 'react';
import { loginWithUserId } from '@/lib/auth/actions';
import { Lock, User, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-seep-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-gold-600 via-gold-500 to-amber-300 text-navy-950 font-black text-3xl shadow-gold-lg mb-4">
            S
          </div>
          <h1 className="font-display text-3xl font-black text-white tracking-tight">
            SEEP <span className="text-gold-500">4.0</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400/90 mt-1">
            Student Entrepreneurs Encouragement Program
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Technology Business Incubator · BITS Pilani Hyderabad Campus
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-panel rounded-3xl p-7 sm:p-8 border border-navy-800 shadow-2xl relative">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Live Auction Console Login
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your pre-assigned team credentials to access the bidding room.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                User ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  name="userId"
                  required
                  placeholder="e.g. TEAM01 or ADMIN01"
                  autoCapitalize="characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-950/80 border border-navy-700 text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition"
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
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-950/80 border border-navy-700 text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-navy-950 font-black text-sm uppercase tracking-wider shadow-gold hover:shadow-gold-lg transition duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Live Auction'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Guarantee */}
          <div className="mt-6 pt-5 border-t border-navy-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted Single-Session Verification Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
