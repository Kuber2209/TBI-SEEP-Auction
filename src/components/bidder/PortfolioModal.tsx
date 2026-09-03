'use client';

import React from 'react';
import { Startup } from '@/lib/supabase/types';
import { Trophy, X, Briefcase, Sparkles } from 'lucide-react';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  wonStartups: Startup[];
  teamName: string;
}

export function PortfolioModal({
  isOpen,
  onClose,
  wonStartups,
  teamName,
}: PortfolioModalProps) {
  if (!isOpen) return null;

  const totalInvested = wonStartups.reduce(
    (sum, s) => sum + Number(s.winning_bid_amount || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-xl bg-[#eff4f0] border border-[#cad7cc] shadow-xl p-6 sm:p-8 relative max-h-[85vh] flex flex-col text-[#203126]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#cad7cc]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 flex items-center justify-center text-[#1a5c3e] font-bold shadow-sm">
              <Briefcase className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#203126] flex items-center gap-2">
                <span>{teamName}&rsquo;s Portfolio</span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#1a5c3e]/10 text-[#1a5c3e] text-xs font-mono font-bold border border-[#1a5c3e]/20">
                  {wonStartups.length} Won
                </span>
              </h2>
              <p className="text-xs text-[#56695e]">
                Official allocations acquired during SEEP 4.0 Grand Finale
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] text-[#56695e] hover:text-[#203126] border border-[#cad7cc] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Investment Aggregate Metric Card */}
        <div className="my-5 p-4 sm:p-5 rounded-xl bg-[#e5ece6] border border-[#cad7cc] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#56695e] block">
              Total Capital Committed
            </span>
            <span className="text-xs text-[#56695e]">Across {wonStartups.length} startup venture lots</span>
          </div>
          <span className="font-semibold text-2xl sm:text-3xl text-[#1a5c3e] font-mono tabular-nums">
            ₹{totalInvested.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Won Lots List */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {wonStartups.length === 0 ? (
            <div className="text-center py-14 text-[#56695e] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-xl bg-[#e5ece6] border border-[#cad7cc] flex items-center justify-center text-[#56695e]/50 mb-3 shadow-inner">
                <Trophy className="w-8 h-8" />
              </div>
              <p className="text-base font-semibold text-[#203126]">No startup lots acquired yet</p>
              <p className="text-xs text-[#56695e] max-w-xs mt-1">
                When your team places the highest bid and the auctioneer closes the round, your won startups will appear here.
              </p>
            </div>
          ) : (
            wonStartups.map((s) => (
              <div
                key={s.id}
                className="p-4 sm:p-4.5 rounded-xl bg-[#f5f8f5] border border-[#cad7cc] hover:border-[#1a5c3e] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#1a5c3e]/10 text-[#1a5c3e] text-[11px] font-mono font-bold border border-[#1a5c3e]/20">
                      LOT #{s.display_order}
                    </span>
                    <h4 className="font-semibold text-[#203126] text-base">{s.name}</h4>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#e5ece6] text-[#203126] border border-[#cad7cc] font-medium">
                      {s.sector}
                    </span>
                  </div>
                  <p className="text-xs text-[#56695e] mt-1 italic line-clamp-1">
                    &ldquo;{s.tagline}&rdquo;
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#cad7cc]">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    Winning Price
                  </span>
                  <span className="font-semibold text-lg text-[#1a5c3e] font-mono tabular-nums">
                    ₹{Number(s.winning_bid_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-[#cad7cc] flex items-center justify-between text-xs text-[#56695e]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#1a5c3e]" />
            Verified on SEEP 4.0 Transaction Ledger
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-md bg-[#1a5c3e] hover:bg-[#144931] text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
