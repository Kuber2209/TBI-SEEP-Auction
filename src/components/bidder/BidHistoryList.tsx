'use client';

import React from 'react';
import { Bid, Profile } from '@/lib/supabase/types';

interface BidHistoryListProps {
  bids: Bid[];
  currentProfile: Profile | null;
}

export function BidHistoryList({ bids, currentProfile }: BidHistoryListProps) {
  return (
    <div className="rounded-xl p-5 sm:p-6 bg-white dark:bg-[#0F131D] border border-slate-200/80 dark:border-white/[0.06] flex flex-col h-full max-h-[420px] transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.06] mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Bid Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time chronological sequence
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
        </span>
      </div>

      {/* Ledger Feed */}
      <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
        {bids.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
            <p>No bids placed on this lot yet.</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">
              Submissions will stream here in real time.
            </p>
          </div>
        ) : (
          bids.map((bid, index) => {
            const isMyBid = currentProfile && bid.bidder_id === currentProfile.id;
            const isTop = index === 0 && (bid.status === 'WINNING' || bid.status === 'SETTLED');

            return (
              <div
                key={bid.id}
                className={`py-2 px-3 rounded-lg flex items-center justify-between transition-colors text-xs ${
                  isTop
                    ? 'bg-amber-50/70 dark:bg-amber-500/10 text-slate-900 dark:text-slate-100 font-medium'
                    : isMyBid
                    ? 'bg-slate-50 dark:bg-white/[0.03] text-slate-800 dark:text-slate-200'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                }`}
              >
                {/* Left: Sequence & Team */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-6 tabular-nums">
                    #{bid.server_seq}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {bid.bidder_profile?.team_name || (isMyBid ? 'Your Team' : 'Investor Team')}
                      </span>
                      {isMyBid && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                          (You)
                        </span>
                      )}
                      {isTop && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                          · Leading
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right: Amount & Status */}
                <div className="text-right">
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    ₹{Number(bid.amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block capitalize">
                    {bid.status.toLowerCase()}
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
