'use client';

import React from 'react';
import { Bid, Profile } from '@/lib/supabase/types';
import { History, ArrowUp, Zap, Sparkles } from 'lucide-react';

interface BidHistoryListProps {
  bids: Bid[];
  currentProfile: Profile | null;
}

export function BidHistoryList({ bids, currentProfile }: BidHistoryListProps) {
  return (
    <div className="glass-card rounded-[24px] p-6 border border-white/[0.07] flex flex-col h-full max-h-[440px] shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.07] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
              Live Round Bid Ledger
            </h3>
            <p className="text-[10px] text-slate-400">Real-time chronologically sequenced submissions</p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-navy-900/80 px-2.5 py-1 rounded-lg border border-white/[0.07]">
          {bids.length} Bids
        </span>
      </div>

      <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
        {bids.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs italic flex flex-col items-center justify-center">
            <Zap className="w-8 h-8 text-navy-800 mb-2" />
            <span>No bids placed on this lot yet.</span>
            <span className="text-[10px] text-slate-600 mt-0.5">Opening bids will appear here immediately.</span>
          </div>
        ) : (
          bids.map((bid, index) => {
            const isMyBid = currentProfile && bid.bidder_id === currentProfile.id;
            const isTop = index === 0 && (bid.status === 'WINNING' || bid.status === 'SETTLED');

            return (
              <div
                key={bid.id}
                className={`p-3 sm:p-3.5 rounded-[16px] border flex items-center justify-between transition-all duration-200 ${
                  isTop
                    ? 'bg-gold-500/15 border-gold-500/50 text-gold-100 shadow-sm'
                    : isMyBid
                    ? 'bg-navy-800/90 border-navy-700 text-white shadow-sm'
                    : 'bg-navy-950/50 border-navy-900/90 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-[12px] flex items-center justify-center text-xs font-mono font-black shrink-0 ${
                      isTop
                        ? 'bg-gold-500 text-navy-950 shadow-sm'
                        : isMyBid
                        ? 'bg-navy-700 text-gold-400 border border-gold-500/30'
                        : 'bg-navy-900 text-slate-400 border border-white/[0.07]'
                    }`}
                  >
                    #{bid.server_seq}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-white font-semibold">
                        {bid.bidder_profile?.team_name || (isMyBid ? 'Your Team' : 'Investor Team')}
                      </span>
                      {isMyBid && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-gold-500/25 text-gold-300 border border-gold-500/40 font-mono font-black">
                          YOU
                        </span>
                      )}
                      {isTop && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          TOP
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(bid.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm sm:text-base text-white flex items-center justify-end gap-1">
                    <span>₹{Number(bid.amount).toLocaleString('en-IN')}</span>
                    {isTop && <ArrowUp className="w-4 h-4 text-gold-400 inline" />}
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider block ${
                      bid.status === 'WINNING' || bid.status === 'SETTLED'
                        ? 'text-emerald-400'
                        : bid.status === 'OUTBID'
                        ? 'text-slate-500'
                        : 'text-rose-400'
                    }`}
                  >
                    {bid.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
