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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-[24px] border border-navy-700 shadow-sm p-6 sm:p-8 relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[16px] bg-gradient-to-tr from-gold-600 via-gold-500 to-amber-300 flex items-center justify-center text-navy-950 font-black shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span>{teamName}&rsquo;s Portfolio</span>
                <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-xs font-mono font-bold border border-gold-500/30">
                  {wonStartups.length} Won
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official allocations acquired during SEEP 4.0 Grand Finale
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-[12px] bg-navy-900 hover:bg-navy-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Investment Aggregate Metric Card */}
        <div className="my-5 p-4 sm:p-5 rounded-[16px] bg-navy-950/80 border border-white/[0.07] flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 block">
              Total Capital Committed
            </span>
            <span className="text-xs text-slate-500">Across {wonStartups.length} startup venture lots</span>
          </div>
          <span className="font-semibold text-2xl sm:text-3xl text-gold-400">
            ₹ {totalInvested.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Won Lots List */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {wonStartups.length === 0 ? (
            <div className="text-center py-14 text-slate-500 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-[16px] bg-navy-900 border border-white/[0.07] flex items-center justify-center text-navy-700 mb-3 shadow-inner">
                <Trophy className="w-8 h-8" />
              </div>
              <p className="text-base font-display font-bold text-slate-300">No startup lots acquired yet</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                When your team places the highest bid and the auctioneer closes the round, your won startups will appear here.
              </p>
            </div>
          ) : (
            wonStartups.map((s) => (
              <div
                key={s.id}
                className="p-4 sm:p-4.5 rounded-[16px] bg-navy-950/70 border border-white/[0.07] hover:border-gold-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-gold-500/20 text-gold-400 text-[11px] font-mono font-black border border-gold-500/30">
                      LOT #{s.display_order}
                    </span>
                    <h4 className="font-display font-bold text-white text-base">{s.name}</h4>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-seep-blue/15 text-seep-sky border border-seep-blue/30 font-medium">
                      {s.sector}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 italic line-clamp-1">
                    &ldquo;{s.tagline}&rdquo;
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-navy-900">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    Winning Price
                  </span>
                  <span className="font-semibold text-lg text-white">
                    ₹ {Number(s.winning_bid_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/[0.07] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-gold-400" />
            Verified on SEEP 4.0 Transaction Ledger
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-[12px] bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-navy-950 font-black text-xs uppercase tracking-wider shadow-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
