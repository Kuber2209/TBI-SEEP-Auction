'use client';

import React, { useMemo, useState } from 'react';
import { Startup } from '@/lib/supabase/types';
import { LotLeaderboardEntry, LeaderboardEntry } from '@/hooks/useDashboardSync';
import { Gavel, Trophy, History, Users } from 'lucide-react';

interface Props {
  activeStartup: Startup | null;
  activeLotLeaderboard?: LotLeaderboardEntry[];
  recentBids?: any[];
  overallLeaderboard?: LeaderboardEntry[];
}

function formatBidTime(isoString?: string) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (_) {
    return '';
  }
}

export function DashboardLeaderboard({
  activeStartup,
  activeLotLeaderboard = [],
  recentBids = [],
  overallLeaderboard = [],
}: Props) {
  // Default to 'bids' to display the full chronological stream of all past bids
  const [viewMode, setViewMode] = useState<'bids' | 'teams'>('bids');

  // Filter and sort all bids placed on this specific active lot (newest first)
  const lotBids = useMemo(() => {
    if (!activeStartup) return [];
    return (recentBids || [])
      .filter((b: any) => b.startup_id === activeStartup.id)
      .sort((a: any, b: any) => {
        if (b.server_seq && a.server_seq) return b.server_seq - a.server_seq;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [recentBids, activeStartup?.id]);

  // Derive investor team rankings
  const lotRankings = useMemo(() => {
    if (activeLotLeaderboard && activeLotLeaderboard.length > 0) {
      return activeLotLeaderboard;
    }

    if (!activeStartup || lotBids.length === 0) return [];

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

    lotBids.forEach((b: any) => {
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
  }, [activeLotLeaderboard, lotBids, activeStartup]);

  const isSold = activeStartup?.status === 'SOLD';
  const isActiveBidding = activeStartup?.status === 'ACTIVE_BIDDING';

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#cad7cc] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Gavel className="w-4 h-4 text-[#1a5c3e] shrink-0" strokeWidth={2.2} />
          <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#1a5c3e] truncate">
            {activeStartup
              ? `LOT ${activeStartup.display_order} · ${activeStartup.name}`
              : 'Active Lot Bids'}
          </span>
        </div>

        {/* View Toggle: All Past Bids vs Grouped by Investor */}
        {activeStartup && lotBids.length > 0 && (
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#eff4f0] border border-[#cad7cc] shrink-0">
            <button
              onClick={() => setViewMode('bids')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'bids'
                  ? 'bg-[#1a5c3e] text-white shadow-2xs'
                  : 'text-[#56695e] hover:text-[#203126]'
              }`}
            >
              <History className="w-3 h-3" />
              <span>All Past Bids ({lotBids.length})</span>
            </button>
            <button
              onClick={() => setViewMode('teams')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'teams'
                  ? 'bg-[#1a5c3e] text-white shadow-2xs'
                  : 'text-[#56695e] hover:text-[#203126]'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Investors ({lotRankings.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      {!activeStartup ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-2 text-center p-4 text-[#56695e]">
          <Trophy className="w-8 h-8 text-[#cad7cc]" />
          <p className="text-xs font-mono uppercase tracking-wider font-semibold">
            Awaiting Next Lot Selection
          </p>
        </div>
      ) : lotBids.length === 0 ? (
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
      ) : viewMode === 'bids' ? (
        /* ── VIEW 1: FULL LIST OF ALL PAST BIDS ─────────────────────────────── */
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 min-h-0">
          {lotBids.map((bid: any, idx: number) => {
            const isLeading = idx === 0;
            const teamName =
              bid.bidder_profile?.team_name ||
              bid.bidder_profile?.display_user_id ||
              'Investor Team';

            const bidAmount = Number(bid.amount || 0);
            const nextBid = lotBids[idx + 1];
            const increment = nextBid ? bidAmount - Number(nextBid.amount || 0) : null;
            const bidSeqNumber = lotBids.length - idx;
            const timeStr = formatBidTime(bid.created_at);

            return (
              <div
                key={bid.id || `bid-${idx}`}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl transition-all ${
                  isLeading
                    ? 'bg-emerald-50/95 border-2 border-[#1a5c3e]/40 shadow-xs'
                    : 'bg-white border border-[#cad7cc] shadow-2xs hover:border-[#1a5c3e]/30'
                }`}
              >
                {/* Left: Sequence Rank & Team Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      isLeading
                        ? 'bg-[#1a5c3e] text-white shadow-xs'
                        : 'bg-[#eff4f0] text-[#56695e] border border-[#cad7cc]'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm sm:text-base truncate ${
                          isLeading
                            ? 'font-black text-[#1a5c3e]'
                            : 'font-bold text-[#203126]'
                        }`}
                      >
                        {teamName}
                      </span>

                      {/* Status Badge */}
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
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                          OUTBID
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#56695e] mt-0.5">
                      <span className="font-semibold text-[#203126]">
                        Bid #{bidSeqNumber}
                      </span>
                      {timeStr && (
                        <>
                          <span className="text-[#cad7cc]">·</span>
                          <span>{timeStr}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Step Increment */}
                <div className="text-right shrink-0 ml-3">
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span
                      className={`font-mono font-black tabular-nums block ${
                        isLeading
                          ? 'text-lg sm:text-xl text-[#1a5c3e]'
                          : 'text-base sm:text-lg text-[#203126]'
                      }`}
                    >
                      ₹{bidAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    {increment !== null && increment > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                        +₹{increment.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-[#8a9a8f] uppercase">
                      {isLeading ? (isSold ? 'Winning Bid' : 'Highest Offer') : 'Prior Offer'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── VIEW 2: GROUPED BY INVESTOR TEAM ────────────────────────────────── */
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 min-h-0">
          {lotRankings.map((entry, idx) => {
            const isLeading = idx === 0;

            return (
              <div
                key={entry.teamId}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl transition-all ${
                  isLeading
                    ? 'bg-emerald-50/95 border-2 border-[#1a5c3e]/40 shadow-xs'
                    : 'bg-white border border-[#cad7cc] shadow-2xs'
                }`}
              >
                {/* Rank & Team Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
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
                        className={`text-sm sm:text-base truncate ${
                          isLeading
                            ? 'font-black text-[#1a5c3e]'
                            : 'font-bold text-[#203126]'
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
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                          OUTBID
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-[#8a9a8f] block mt-0.5">
                      {entry.bidCount} bid{entry.bidCount !== 1 ? 's' : ''} submitted
                    </span>
                  </div>
                </div>

                {/* Offer Valuation */}
                <div className="text-right shrink-0 ml-3">
                  <span
                    className={`font-mono font-black tabular-nums block ${
                      isLeading
                        ? 'text-lg sm:text-xl text-[#1a5c3e]'
                        : 'text-base sm:text-lg text-[#203126]'
                    }`}
                  >
                    ₹{Number(entry.highestBid).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-mono text-[#8a9a8f] block uppercase font-medium mt-0.5">
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
