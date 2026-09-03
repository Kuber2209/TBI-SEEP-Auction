'use client';

import React from 'react';
import { Bid, Profile } from '@/lib/supabase/types';

interface BidHistoryListProps {
  bids: Bid[];
  currentProfile: Profile | null;
}

export function BidHistoryList({ bids, currentProfile }: BidHistoryListProps) {
  return (
    <div className="rounded-xl p-5 sm:p-6 bg-[#f9f8f6] border border-[#e2e5ea] flex flex-col h-full max-h-[420px] shadow-sm transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#e2e5ea] mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#33404f]">
            Bid Ledger
          </h3>
          <p className="text-xs text-[#6b7a8d]">
            Real-time chronological sequence
          </p>
        </div>
        <span className="text-xs font-mono text-[#6b7a8d]">
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
        </span>
      </div>

      {/* Ledger Feed */}
      <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
        {bids.length === 0 ? (
          <div className="text-center py-12 text-[#6b7a8d] text-xs">
            <p>No bids placed on this lot yet.</p>
            <p className="text-[11px] text-[#6b7a8d] mt-1">
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
                className={`py-2 px-3 rounded-md flex items-center justify-between transition-colors text-xs border ${
                  isTop
                    ? 'bg-emerald-50 border-emerald-200 text-[#33404f] font-medium'
                    : isMyBid
                    ? 'bg-[#f1f4f7] border-[#e2e5ea] text-[#33404f]'
                    : 'bg-transparent hover:bg-white border-transparent text-[#33404f]'
                }`}
              >
                {/* Left: Sequence & Team */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#6b7a8d] w-6 tabular-nums font-semibold">
                    #{bid.server_seq}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#33404f]">
                        {bid.bidder_profile?.team_name || (isMyBid ? 'Your Team' : 'Investor Team')}
                      </span>
                      {isMyBid && (
                        <span className="text-[10px] text-[#1a5c3e] font-semibold">
                          (You)
                        </span>
                      )}
                      {isTop && (
                        <span className="text-[10px] text-emerald-800 font-semibold">
                          · Leading
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6b7a8d] font-mono">
                      {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right: Amount & Status */}
                <div className="text-right">
                  <span className="font-semibold text-[#33404f] font-mono tabular-nums">
                    ₹{Number(bid.amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-[#6b7a8d] block capitalize">
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
