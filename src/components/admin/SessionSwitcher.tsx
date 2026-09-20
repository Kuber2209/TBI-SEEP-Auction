'use client';

import React, { useState } from 'react';
import { AuctionSession } from '@/lib/supabase/types';
import { FlaskConical, Trophy, ChevronDown, Loader2, RotateCcw } from 'lucide-react';

interface SessionSwitcherProps {
  currentSession: AuctionSession | null;
  allSessions: AuctionSession[];
  onSwitch: (sessionId: string) => Promise<void>;
  onResetMock: (sessionId: string) => Promise<void>;
  isProcessing?: boolean;
}

/**
 * Admin-only session switcher dropdown.
 * Lets the operator toggle between the Mock Round session and the Real Auction session.
 * Only visible in the admin command ribbon.
 */
export function SessionSwitcher({
  currentSession,
  allSessions,
  onSwitch,
  onResetMock,
  isProcessing = false,
}: SessionSwitcherProps) {
  const [open, setOpen] = useState(false);

  if (allSessions.length <= 1) return null;

  const mockSession = allSessions.find((s) => s.is_rehearsal);
  const realSession = allSessions.find((s) => !s.is_rehearsal);

  const isMockActive = currentSession?.is_rehearsal === true;

  const handleSwitch = async (targetId: string) => {
    setOpen(false);
    await onSwitch(targetId);
  };

  const handleResetMock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mockSession) return;
    if (!confirm('Reset mock session? This wipes all demo bids and restores demo purses. Real session is unaffected.')) return;
    await onResetMock(mockSession.id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isProcessing}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition active:scale-[0.98] ${
          isMockActive
            ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-sm'
            : 'bg-[#1a5c3e]/10 text-[#1a5c3e] border-[#1a5c3e]/30 shadow-sm'
        }`}
        title="Switch between Mock Round and Real Auction session"
      >
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isMockActive ? (
          <FlaskConical className="w-3.5 h-3.5 text-amber-700" strokeWidth={2} />
        ) : (
          <Trophy className="w-3.5 h-3.5 text-[#1a5c3e]" strokeWidth={1.75} />
        )}
        <span>{isMockActive ? 'Mock Round Active' : 'Real Auction Active'}</span>
        <ChevronDown className="w-3 h-3 opacity-60" strokeWidth={2} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl bg-white border border-[#cad7cc] shadow-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-[#f5f8f5] border-b border-[#e5ece6]">
              <p className="text-[11px] font-semibold text-[#56695e] uppercase tracking-wider">
                Session Selector
              </p>
            </div>

            {/* Mock Session Option */}
            {mockSession && (
              <div
                className={`p-3.5 border-b border-[#f0f4f0] hover:bg-amber-50/60 transition cursor-pointer ${
                  isMockActive ? 'bg-amber-50' : ''
                }`}
                onClick={() => handleSwitch(mockSession.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <FlaskConical className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" strokeWidth={2} />
                    <div>
                      <p className="text-xs font-semibold text-[#203126]">
                        {mockSession.name}
                        {isMockActive && (
                          <span className="ml-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md">
                            ACTIVE
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Demo purse: ₹{Number(mockSession.initial_purse_amount).toLocaleString('en-IN')} · Practice only
                      </p>
                    </div>
                  </div>
                  {isMockActive && (
                    <button
                      onClick={handleResetMock}
                      className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-semibold border border-amber-300 transition"
                      title="Wipe all demo bids and restore demo purses"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Real Session Option */}
            {realSession && (
              <div
                className={`p-3.5 hover:bg-[#f0f7f2] transition cursor-pointer ${
                  !isMockActive ? 'bg-[#f5faf6]' : ''
                }`}
                onClick={() => handleSwitch(realSession.id)}
              >
                <div className="flex items-start gap-2.5">
                  <Trophy className="w-4 h-4 text-[#1a5c3e] mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div>
                    <p className="text-xs font-semibold text-[#203126]">
                      {realSession.name}
                      {!isMockActive && (
                        <span className="ml-1.5 text-[10px] font-bold text-[#1a5c3e] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                          ACTIVE
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#56695e] mt-0.5">
                      Real purse: ₹{Number(realSession.initial_purse_amount).toLocaleString('en-IN')} · Official bids
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 py-2.5 bg-[#f5f8f5] border-t border-[#e5ece6]">
              <p className="text-[10px] text-[#56695e]">
                Switching session is immediate and broadcasts to all connected bidders.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
