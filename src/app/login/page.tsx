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
      <div className="min-h-screen bg-[#dfe7e0] text-[#203126] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-150">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <ThemeToggle />
        </div>

        {/* Main Container */}
        <div className="w-full max-w-md z-10 space-y-6">
          {/* Official TBI BITS Pilani Logo Banner */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3.5 rounded-xl bg-[#eff4f0] border border-[#cad7cc] shadow-sm flex items-center justify-center">
                <img
                  src="/images/tbi-bits-logo.png"
                  alt="Technology Business Incubator - BITS Pilani Hyderabad Campus"
                  className="h-16 sm:h-20 w-auto object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#203126] tracking-tight text-balance">
              SEEP <span className="text-[#1a5c3e]">4.0</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1a5c3e] mt-1">
              Student Entrepreneurs Encouragement Program
            </p>
            <p className="text-[11px] text-[#56695e] font-medium mt-0.5">
              Live Venture Deal Flow & Allocation Arena
            </p>
          </div>

          {/* Login Box */}
          <div className="bg-[#eff4f0] rounded-xl p-7 sm:p-9 border border-[#cad7cc] shadow-sm relative overflow-hidden">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#203126] tracking-tight text-balance">
                Live Auction Console Access
              </h2>
              <p className="text-xs text-[#56695e] mt-1">
                Enter your institutional credentials to authenticate your console.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#56695e] mb-1.5">
                  User / Team ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#56695e] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADMIN01 or TEAM01"
                    className="w-full pl-10 pr-4 py-2.5 rounded-md bg-[#f5f8f5] border border-[#cad7cc] text-sm text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e] transition-colors duration-150"
                    name="userId"
                    value={userIdVal}
                    onChange={(e) => setUserIdVal(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#56695e] mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#56695e] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-md bg-[#f5f8f5] border border-[#cad7cc] text-sm text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e] transition-colors duration-150"
                    name="password"
                    value={passwordVal}
                    onChange={(e) => setPasswordVal(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 rounded-md bg-[#1a5c3e] hover:bg-[#144931] text-white font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <span>Securing Handshake...</span>
                ) : (
                  <>
                    <span>Enter Live Auction</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Rehearsal Credentials Helper */}
            <div className="mt-6 pt-5 border-t border-[#cad7cc]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#56695e] block mb-2 text-center">
                Rehearsal Quick Credentials
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('ADMIN01', 'AdminPassword123!')}
                  className="p-2 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] border border-[#cad7cc] text-[#203126] font-medium text-center transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#1a5c3e]" />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('TEAM01', 'PassTEAM01#2026')}
                  className="p-2 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] border border-[#cad7cc] text-[#203126] font-medium text-center transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#1a5c3e]" />
                  Team 01
                </button>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="mt-5 pt-4 border-t border-[#cad7cc] flex items-center justify-center gap-2 text-[11px] text-[#56695e] font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Single-Device Session Encryption Active</span>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
