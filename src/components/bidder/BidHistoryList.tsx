'use client';

import React from 'react';
import { Bid, Profile } from '@/lib/supabase/types';

interface BidHistoryListProps {
  bids: Bid[];
  currentProfile: Profile | null;
}

export function BidHistoryList({ bids, currentProfile }: BidHistoryListProps) {
  return (
    <div className="rounded-xl p-5 sm:p-6 bg-[#eff4f0] border border-[#cad7cc] flex flex-col h-full max-h-[420px] shadow-sm transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#cad7cc] mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#203126]">
            Bid Ledger
          </h3>
          <p className="text-xs text-[#56695e]">
            Real-time chronological sequence
          </p>
        </div>
        <span className="text-xs font-mono text-[#56695e]">
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
        </span>
      </div>

      {/* Ledger Feed */}
      <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
        {bids.length === 0 ? (
          <div className="text-center py-12 text-[#56695e] text-xs">
            <p>No bids placed on this lot yet.</p>
            <p className="text-[11px] text-[#56695e] mt-1">
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
                    ? 'bg-emerald-50 border-emerald-200 text-[#203126] font-medium'
                    : isMyBid
                    ? 'bg-[#e5ece6] border-[#cad7cc] text-[#203126]'
                    : 'bg-transparent hover:bg-[#f5f8f5] border-transparent text-[#203126]'
                }`}
              >
                {/* Left: Sequence & Team */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#56695e] w-6 tabular-nums font-semibold">
                    #{bid.server_seq}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#203126]">
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
                    <span className="text-[10px] text-[#56695e] font-mono">
                      {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right: Amount & Status */}
                <div className="text-right">
                  <span className="font-semibold text-[#203126] font-mono tabular-nums">
                    ₹{Number(bid.amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-[#56695e] block capitalize">
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
