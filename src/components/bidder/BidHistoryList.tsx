'use client';

import React from 'react';
import { Bid, Profile } from '@/lib/supabase/types';
import { History, Shield, ArrowUp } from 'lucide-react';

interface BidHistoryListProps {
  bids: Bid[];
  currentProfile: Profile | null;
}

export function BidHistoryList({ bids, currentProfile }: BidHistoryListProps) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-navy-800 flex flex-col h-full max-h-[420px]">
      <div className="flex items-center justify-between pb-3 border-b border-navy-800 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gold-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Live Round Bids
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {bids.length} submissions
        </span>
      </div>

      <div className="overflow-y-auto space-y-2 pr-1 flex-1">
        {bids.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs italic">
            No bids placed on this lot yet.
          </div>
        ) : (
          bids.map((bid, index) => {
            const isMyBid = currentProfile && bid.bidder_id === currentProfile.id;
            const isTop = index === 0 && (bid.status === 'WINNING' || bid.status === 'SETTLED');

            return (
              <div
                key={bid.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isTop
                    ? 'bg-gold-500/10 border-gold-500/40 text-gold-200'
                    : isMyBid
                    ? 'bg-navy-800/80 border-navy-700 text-white'
                    : 'bg-navy-950/40 border-navy-900 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isTop
                        ? 'bg-gold-500 text-navy-950'
                        : isMyBid
                        ? 'bg-navy-700 text-gold-400'
                        : 'bg-navy-900 text-slate-400'
                    }`}
                  >
                    #{bid.server_seq}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span>{bid.bidder_profile?.team_name || (isMyBid ? 'Your Team' : 'Investor Team')}</span>
                      {isMyBid && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-gold-500/20 text-gold-400 font-mono">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(bid.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-white flex items-center justify-end gap-1">
                    <span>₹{Number(bid.amount).toLocaleString('en-IN')}</span>
                    {isTop && <ArrowUp className="w-3.5 h-3.5 text-gold-400 inline" />}
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
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
