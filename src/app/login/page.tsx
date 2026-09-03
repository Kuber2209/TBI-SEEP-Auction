'use client';

import React, { useState } from 'react';
import { loginWithUserId } from '@/lib/auth/actions';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, KeyRound, Building2 } from 'lucide-react';

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
      <div className="min-h-screen bg-[#f0f5f1] text-[#33404f] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-150">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <ThemeToggle />
        </div>

        {/* Main Container */}
        <div className="w-full max-w-md z-10 space-y-6">
          {/* Brand Banner */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 shadow-sm mb-4">
              <Building2 className="w-6 h-6 text-[#1a5c3e]" strokeWidth={1.75} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#33404f] tracking-tight text-balance">
              SEEP <span className="text-[#1a5c3e]">4.0</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1a5c3e] mt-1">
              Student Entrepreneurs Encouragement Program
            </p>
            <p className="text-[11px] text-[#6b7a8d] font-medium mt-0.5">
              Technology Business Incubator · BITS Pilani Hyderabad Campus
            </p>
          </div>

          {/* Login Box */}
          <div className="bg-[#f9f8f6] rounded-xl p-7 sm:p-9 border border-[#e2e5ea] shadow-sm relative overflow-hidden">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#33404f] tracking-tight text-balance">
                Live Auction Console Access
              </h2>
              <p className="text-xs text-[#6b7a8d] mt-1 text-pretty">
                Enter your pre-assigned team credentials to enter the live room.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" strokeWidth={1.5} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#33404f] block mb-1.5">
                  Team User ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#6b7a8d]" strokeWidth={1.75} />
                  <input
                    type="text"
                    name="userId"
                    required
                    value={userIdVal}
                    onChange={(e) => setUserIdVal(e.target.value)}
                    placeholder="e.g. TEAM01 or ADMIN01"
                    autoCapitalize="characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-md bg-white border border-[#e2e5ea] text-sm text-[#33404f] placeholder:text-[#6b7a8d] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e] transition-colors duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#33404f] block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#6b7a8d]" strokeWidth={1.75} />
                  <input
                    type="password"
                    name="password"
                    required
                    value={passwordVal}
                    onChange={(e) => setPasswordVal(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-md bg-white border border-[#e2e5ea] text-sm text-[#33404f] placeholder:text-[#6b7a8d] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e] transition-colors duration-150"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-white font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-sm"
              >
                <span>{loading ? 'Authenticating...' : 'Enter Live Auction'}</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </form>

            {/* Quick Demo Rehearsal Helpers */}
            <div className="mt-6 pt-5 border-t border-[#e2e5ea]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7a8d] block mb-2 text-center">
                Rehearsal Quick Credentials
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('ADMIN01', 'AdminPassword123!')}
                  className="p-2 rounded-md bg-[#f1f4f7] hover:bg-[#e2e5ea] border border-[#e2e5ea] text-[#33404f] font-medium text-center transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#1a5c3e]" strokeWidth={1.75} /> Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('TEAM01', 'PassTEAM01#2026')}
                  className="p-2 rounded-md bg-[#f1f4f7] hover:bg-[#e2e5ea] border border-[#e2e5ea] text-[#33404f] font-medium text-center transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#1a5c3e]" strokeWidth={1.75} /> Team 01
                </button>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="mt-5 pt-4 border-t border-[#e2e5ea] flex items-center justify-center gap-2 text-[11px] text-[#6b7a8d] font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Single-Device Session Encryption Active</span>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
