'use client';

import React from 'react';
import { Startup } from '@/lib/supabase/types';
import { X, Trophy, Briefcase, Tag, Sparkles, Building2 } from 'lucide-react';

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
      <div className="w-full max-w-2xl rounded-xl bg-[#f9f8f6] border border-[#e2e5ea] shadow-xl p-6 sm:p-8 relative max-h-[85vh] flex flex-col text-[#33404f]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e2e5ea]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 flex items-center justify-center text-[#1a5c3e] font-bold shadow-sm">
              <Briefcase className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#33404f] flex items-center gap-2">
                <span>{teamName}&rsquo;s Portfolio</span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#1a5c3e]/10 text-[#1a5c3e] text-xs font-mono font-bold border border-[#1a5c3e]/20">
                  {wonStartups.length} Won
                </span>
              </h2>
              <p className="text-xs text-[#6b7a8d]">
                Official allocations acquired during SEEP 4.0 Grand Finale
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-md bg-[#f1f4f7] hover:bg-[#e2e5ea] text-[#6b7a8d] hover:text-[#33404f] border border-[#e2e5ea] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Investment Aggregate Metric Card */}
        <div className="my-5 p-4 sm:p-5 rounded-xl bg-white border border-[#e2e5ea] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#6b7a8d] block">
              Total Capital Committed
            </span>
            <span className="text-xs text-[#6b7a8d]">Across {wonStartups.length} startup venture lots</span>
          </div>
          <span className="font-semibold text-2xl sm:text-3xl text-[#1a5c3e] font-mono tabular-nums">
            ₹{totalInvested.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Won Lots List */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {wonStartups.length === 0 ? (
            <div className="text-center py-14 text-[#6b7a8d] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-xl bg-[#f1f4f7] border border-[#e2e5ea] flex items-center justify-center text-[#6b7a8d]/50 mb-3 shadow-inner">
                <Trophy className="w-8 h-8" />
              </div>
              <p className="text-base font-semibold text-[#33404f]">No startup lots acquired yet</p>
              <p className="text-xs text-[#6b7a8d] max-w-xs mt-1">
                When your team places the highest bid and the auctioneer closes the round, your won startups will appear here.
              </p>
            </div>
          ) : (
            wonStartups.map((s) => (
              <div
                key={s.id}
                className="p-4 sm:p-4.5 rounded-xl bg-white border border-[#e2e5ea] hover:border-[#1a5c3e] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#1a5c3e]/10 text-[#1a5c3e] text-[11px] font-mono font-bold border border-[#1a5c3e]/20">
                      LOT #{s.display_order}
                    </span>
                    <h4 className="font-semibold text-[#33404f] text-base">{s.name}</h4>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#f1f4f7] text-[#33404f] border border-[#e2e5ea] font-medium">
                      {s.sector}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7a8d] mt-1 italic line-clamp-1">
                    &ldquo;{s.tagline}&rdquo;
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e2e5ea]">
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
        <div className="mt-5 pt-4 border-t border-[#e2e5ea] flex items-center justify-between text-xs text-[#6b7a8d]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#1a5c3e]" />
            Verified on SEEP 4.0 Transaction Ledger
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
