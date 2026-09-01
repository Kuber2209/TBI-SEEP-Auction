'use client';

import React from 'react';
import { Startup } from '@/lib/supabase/types';
import { X, Trophy, Briefcase, Tag, Calendar } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-navy-700 shadow-2xl p-6 lg:p-7 relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{teamName}&rsquo;s Portfolio</span>
                <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 text-xs font-mono">
                  {wonStartups.length} Acquired
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Startups won during SEEP 4.0 Grand Finale
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Investment Summary */}
        <div className="my-4 p-4 rounded-xl bg-navy-900/80 border border-navy-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Capital Deployed
          </span>
          <span className="font-mono text-xl font-black text-gold-400">
            ₹ {totalInvested.toLocaleString('en-IN')}
          </span>
        </div>

        {/* List of Won Startups */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {wonStartups.length === 0 ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center">
              <Trophy className="w-10 h-10 text-navy-800 mb-2" />
              <p className="text-sm font-semibold">No startups acquired yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Participate in live bidding rounds to win startup allocations.
              </p>
            </div>
          ) : (
            wonStartups.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-navy-950/60 border border-navy-800 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-navy-800 text-[10px] font-mono font-bold text-gold-400">
                      LOT #{s.display_order}
                    </span>
                    <h4 className="font-bold text-white text-base">{s.name}</h4>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-seep-blue/15 text-seep-sky border border-seep-blue/30 font-medium">
                      {s.sector}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                    &ldquo;{s.tagline}&rdquo;
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    Winning Bid
                  </span>
                  <span className="font-mono text-base font-black text-white">
                    ₹ {Number(s.winning_bid_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-navy-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-xs font-bold text-white transition"
          >
            Close Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
