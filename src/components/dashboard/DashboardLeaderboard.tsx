'use client';

import React, { useMemo } from 'react';
import { Startup } from '@/lib/supabase/types';
import { LotLeaderboardEntry, LeaderboardEntry } from '@/hooks/useDashboardSync';
import { Gavel, Trophy, ShieldCheck } from 'lucide-react';

interface Props {
  activeStartup: Startup | null;
  activeLotLeaderboard?: LotLeaderboardEntry[];
  recentBids?: any[];
  overallLeaderboard?: LeaderboardEntry[];
}

export function DashboardLeaderboard({
  activeStartup,
  activeLotLeaderboard = [],
  recentBids = [],
  overallLeaderboard = [],
}: Props) {
  // Derive current startup leaderboard if activeLotLeaderboard is empty but recentBids exist
  const lotRankings = useMemo(() => {
    if (activeLotLeaderboard && activeLotLeaderboard.length > 0) {
      return activeLotLeaderboard;
    }

    if (!activeStartup || recentBids.length === 0) return [];

    const map = new Map<
      string,
      {
        teamId: string;
        teamName: string;
        highestBid: number;
        bidCount: number;
        latestBidAt: string;
      }
    >();

    recentBids.forEach((b: any) => {
      const tid = b.bidder_id;
      const teamName =
        b.bidder_profile?.team_name ||
        b.bidder_profile?.display_user_id ||
        'Team';
      const amt = Number(b.amount || 0);
      const existing = map.get(tid);

      if (existing) {
        existing.bidCount += 1;
        if (amt > existing.highestBid) {
          existing.highestBid = amt;
          existing.latestBidAt = b.created_at;
        }
      } else {
        map.set(tid, {
          teamId: tid,
          teamName,
          highestBid: amt,
          bidCount: 1,
          latestBidAt: b.created_at,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.highestBid - a.highestBid);
  }, [activeLotLeaderboard, recentBids, activeStartup]);

  const isSold = activeStartup?.status === 'SOLD';
  const isActiveBidding = activeStartup?.status === 'ACTIVE_BIDDING';

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Gavel className="w-4 h-4 text-[#1a5c3e] shrink-0" strokeWidth={2} />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1a5c3e] truncate">
            {activeStartup
              ? `Lot ${activeStartup.display_order} · ${activeStartup.name}`
              : 'Current Lot Investor Board'}
          </span>
        </div>

        <span className="text-xs font-mono text-[#56695e] shrink-0 font-medium">
          {lotRankings.length > 0 ? (
            <span>
              <strong className="text-[#1a5c3e]">{lotRankings.length}</strong>{' '}
              investor{lotRankings.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>Floor: ₹{Number(activeStartup?.base_price || 5000).toLocaleString('en-IN')}</span>
          )}
        </span>
      </div>

      {/* Content */}
      {!activeStartup ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-2 text-center p-4 text-[#56695e]">
          <Trophy className="w-8 h-8 text-[#cad7cc]" />
          <p className="text-xs font-mono uppercase tracking-wider font-semibold">
            Awaiting Next Lot Selection
          </p>
        </div>
      ) : lotRankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-2 text-center p-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#1a5c3e]">
            <Gavel className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#203126]">
              Awaiting Opening Offers
            </p>
            <p className="text-xs text-[#56695e] mt-0.5">
              No bids placed yet on <strong className="text-[#203126]">{activeStartup.name}</strong>.
            </p>
          </div>
          <div className="mt-1 px-3 py-1 rounded-md bg-emerald-50/80 border border-emerald-100 text-xs font-mono text-[#1a5c3e] font-semibold">
            Floor Reserve: ₹{Number(activeStartup.base_price || 5000).toLocaleString('en-IN')}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5 flex-1">
          {lotRankings.map((entry, idx) => {
            const isLeading = idx === 0;

            return (
              <div
                key={entry.teamId}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                  isLeading
                    ? 'bg-emerald-50/90 border-2 border-[#1a5c3e]/40 shadow-xs'
                    : 'bg-white border border-[#cad7cc] shadow-2xs'
                }`}
              >
                {/* Rank & Team Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      isLeading
                        ? 'bg-[#1a5c3e] text-white shadow-xs'
                        : 'bg-[#eff4f0] text-[#203126] border border-[#cad7cc]'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm truncate ${
                          isLeading
                            ? 'font-bold text-[#1a5c3e]'
                            : 'font-semibold text-[#203126]'
                        }`}
                      >
                        {entry.teamName}
                      </span>

                      {/* Status Tag */}
                      {isLeading ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isSold
                              ? 'bg-[#1a5c3e] text-white'
                              : isActiveBidding
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isActiveBidding && !isSold && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          )}
                          {isSold ? 'ACQUIRED' : 'LEADER'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                          OUTBID
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-[#8a9a8f] block">
                      {entry.bidCount} bid{entry.bidCount !== 1 ? 's' : ''} submitted
                    </span>
                  </div>
                </div>

                {/* Offer Valuation */}
                <div className="text-right shrink-0 ml-3">
                  <span
                    className={`font-mono font-bold tabular-nums block ${
                      isLeading ? 'text-base sm:text-lg text-[#1a5c3e]' : 'text-sm text-[#203126]'
                    }`}
                  >
                    ₹{Number(entry.highestBid).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-mono text-[#8a9a8f] block">
                    {isLeading ? 'Highest Offer' : 'Prior Offer'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
