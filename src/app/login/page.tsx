'use client';

import React, { useState, useEffect } from 'react';
import { loginWithUserId } from '@/lib/auth/actions';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Lock, User, ArrowRight, AlertCircle, Smartphone } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userIdVal, setUserIdVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [sessionNotice, setSessionNotice] = useState<{
    title: string;
    description: string;
    type: 'kicked' | 'revoked';
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason');
      if (reason === 'session_kicked') {
        setSessionNotice({
          type: 'kicked',
          title: 'Duplicate Login Detected',
          description:
            'Another person logged in using this account on another device. You have been logged out on this device to protect your bidding purse.',
        });
      } else if (reason === 'session_revoked') {
        setSessionNotice({
          type: 'revoked',
          title: 'Session Expired',
          description:
            'Your active session has expired or was reset by the event administrator. Please sign in again to continue.',
        });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSessionNotice(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginWithUserId(null, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Authentication Interface Error">
      <div className="min-h-screen bg-[#dfe7e0] text-[#203126] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-150">
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

            {sessionNotice && (
              <div
                className={`mb-5 p-3.5 rounded-lg border text-xs flex items-start gap-3 shadow-sm ${
                  sessionNotice.type === 'kicked'
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : 'bg-blue-50/90 border-blue-200 text-blue-950'
                }`}
              >
                {sessionNotice.type === 'kicked' ? (
                  <Smartphone className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" strokeWidth={2} />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-blue-700 mt-0.5" strokeWidth={2} />
                )}
                <div className="space-y-0.5">
                  <p className="font-semibold text-xs text-[#203126]">
                    {sessionNotice.title}
                  </p>
                  <p className="text-[11px] text-[#56695e] leading-relaxed">
                    {sessionNotice.description}
                  </p>
                </div>
              </div>
            )}

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
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
