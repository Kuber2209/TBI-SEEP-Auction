'use client';

import React, { useState } from 'react';
import {
  setStageStatusAction,
  closeAuctionAction,
  reopenAuctionAction,
  voidBidAction,
} from '@/lib/auction/actions';
import { Bid, Startup } from '@/lib/supabase/types';
import {
  Play,
  Pause,
  Gavel,
  RotateCcw,
  SkipForward,
  Radio,
  AlertOctagon,
  Trash2,
  Loader2,
  Flame,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface StageControlPanelProps {
  activeStartup: Startup | null;
  startups: Startup[];
  recentBids: Bid[];
  onSelectStartup: (startup: Startup) => void;
  onActionComplete?: () => void;
}

export function StageControlPanel({
  activeStartup,
  startups,
  recentBids,
  onSelectStartup,
  onActionComplete,
}: StageControlPanelProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [targetVoidBidId, setTargetVoidBidId] = useState<string | null>(null);

  if (!activeStartup) {
    return (
      <div className="rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[320px] bg-white dark:bg-[#070D1E] border border-slate-200/80 dark:border-white/[0.08]">
        <Radio className="w-10 h-10 text-slate-400 mb-3 animate-pulse" />
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">No Startup Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Select a startup from the queue to begin stage driver orchestration.
        </p>
      </div>
    );
  }

  const handleSetStatus = async (status: any) => {
    setLoadingAction(`status_${status}`);
    setActionError(null);
    try {
      const res = await setStageStatusAction(activeStartup.id, status);
      if (!res.success) setActionError(res.error || 'Failed to update status');
      if (onActionComplete) onActionComplete();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCloseAuction = async () => {
    setLoadingAction('close');
    setActionError(null);
    try {
      const res = await closeAuctionAction(activeStartup.id);
      if (!res.success) setActionError(res.error || 'Failed to close auction');
      if (onActionComplete) onActionComplete();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReopenAuction = async () => {
    setLoadingAction('reopen');
    setActionError(null);
    try {
      const res = await reopenAuctionAction(activeStartup.id);
      if (!res.success) setActionError(res.error || 'Failed to reopen auction');
      if (onActionComplete) onActionComplete();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVoidBid = async (bidId: string) => {
    if (!voidReason.trim()) {
      alert('Please provide a reason for voiding this bid.');
      return;
    }
    setLoadingAction(`void_${bidId}`);
    try {
      const res = await voidBidAction(bidId, voidReason);
      if (!res.success) setActionError(res.error || 'Failed to void bid');
      setTargetVoidBidId(null);
      setVoidReason('');
      if (onActionComplete) onActionComplete();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const currentIndex = startups.findIndex((s) => s.id === activeStartup.id);
  const nextStartup = currentIndex >= 0 && currentIndex < startups.length - 1 ? startups[currentIndex + 1] : null;

  const handleAdvanceNext = () => {
    if (nextStartup) {
      onSelectStartup(nextStartup);
      handleSetStatus('PRESENTING');
    }
  };

  const currentBid = activeStartup.current_highest_bid;
  const basePrice = activeStartup.base_price;
  const topBid = recentBids.find((b) => b.status === 'WINNING' || b.status === 'SETTLED');

  return (
    <div className="rounded-xl p-5 sm:p-6 lg:p-7 bg-white dark:bg-[#070D1E] border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-6 transition-colors duration-150">
      {/* Active Lot Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-semibold border border-amber-500/20">
              LOT #{activeStartup.display_order}
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {activeStartup.name}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeStartup.sector} · Floor Reserve: ₹{Number(activeStartup.base_price).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              activeStartup.status === 'ACTIVE_BIDDING'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                : activeStartup.status === 'PRESENTING'
                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                : activeStartup.status === 'PAUSED'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                : activeStartup.status === 'SOLD'
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {activeStartup.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 🔴 OPERATOR TELEPROMPTER: High-Visibility Current Bid Display (For admin facing laptop) */}
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0D1838] border border-slate-200 dark:border-white/[0.08] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-gold-400" />
            Current Highest Offer (Live Teleprompter)
          </span>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
            {recentBids.length} bids placed
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              ₹{Number(currentBid || basePrice).toLocaleString('en-IN')}
            </span>
            {currentBid === null && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                (Floor Reserve)
              </span>
            )}
          </div>

          <div className="text-right">
            {topBid ? (
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                  Leading: {topBid.bidder_profile?.team_name || 'Team'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {topBid.bidder_profile?.display_user_id} · Escrow Locked
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                Awaiting opening offer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stage Action Controls Grid */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          Stage Workflow Controls
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* 1. Set Presenting */}
          <button
            onClick={() => handleSetStatus('PRESENTING')}
            disabled={Boolean(loadingAction) || activeStartup.status === 'PRESENTING'}
            className="p-3.5 sm:p-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 dark:hover:bg-navy-850 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-white font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 border border-slate-200 dark:border-white/[0.08] transition active:scale-[0.98]"
          >
            <Radio className="w-4 h-4 text-blue-500 dark:text-blue-400" strokeWidth={1.75} />
            <span>1. Set Presenting</span>
          </button>

          {/* 2. Start Bidding */}
          <button
            onClick={() => handleSetStatus('ACTIVE_BIDDING')}
            disabled={
              Boolean(loadingAction) ||
              activeStartup.status === 'ACTIVE_BIDDING' ||
              activeStartup.status === 'SOLD'
            }
            className="p-3.5 sm:p-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            {loadingAction === 'status_ACTIVE_BIDDING' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Flame className="w-4 h-4" strokeWidth={1.75} />
            )}
            <span>2. Open Bidding</span>
          </button>

          {/* Pause / Resume */}
          {activeStartup.status === 'PAUSED' ? (
            <button
              onClick={() => handleSetStatus('ACTIVE_BIDDING')}
              disabled={Boolean(loadingAction)}
              className="p-3.5 sm:p-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.98]"
            >
              <Play className="w-4 h-4" strokeWidth={1.75} />
              <span>Resume Bidding</span>
            </button>
          ) : (
            <button
              onClick={() => handleSetStatus('PAUSED')}
              disabled={Boolean(loadingAction) || activeStartup.status !== 'ACTIVE_BIDDING'}
              className="p-3.5 sm:p-4 rounded-lg bg-slate-100 hover:bg-amber-50 dark:bg-navy-900 dark:hover:bg-amber-950/30 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-white font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 border border-slate-200 dark:border-white/[0.08] transition active:scale-[0.98]"
            >
              <Pause className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
              <span>Pause Bidding</span>
            </button>
          )}

          {/* 3. Close Auction */}
          <button
            onClick={handleCloseAuction}
            disabled={
              Boolean(loadingAction) ||
              !['ACTIVE_BIDDING', 'PAUSED'].includes(activeStartup.status)
            }
            className="p-3.5 sm:p-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            {loadingAction === 'close' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gavel className="w-4 h-4" strokeWidth={1.75} />
            )}
            <span>3. Close (Settle)</span>
          </button>

          {/* Reopen Auction */}
          <button
            onClick={handleReopenAuction}
            disabled={Boolean(loadingAction) || !['SOLD', 'UNSOLD'].includes(activeStartup.status)}
            className="p-3.5 sm:p-4 rounded-lg bg-slate-100 hover:bg-purple-50 dark:bg-navy-900 dark:hover:bg-purple-950/30 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-white font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 border border-slate-200 dark:border-white/[0.08] transition active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={1.75} />
            <span>Reopen Round</span>
          </button>

          {/* 4. Advance Next */}
          <button
            onClick={handleAdvanceNext}
            disabled={Boolean(loadingAction) || activeStartup.status !== 'SOLD'}
            className="p-3.5 sm:p-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 dark:hover:bg-navy-850 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-white font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 border border-slate-200 dark:border-white/[0.08] transition active:scale-[0.98]"
          >
            <SkipForward className="w-4 h-4 text-blue-500 dark:text-blue-400" strokeWidth={1.75} />
            <span>4. Next Lot</span>
          </button>
        </div>
      </div>

      {/* 🔴 OPERATOR LIVE BID LOG: Real-time stream of all submissions on this lot */}
      <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-gold-400" strokeWidth={1.75} />
            Live Lot Bid Stream & Audit Log
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
            {recentBids.length} total submissions
          </span>
        </div>

        {recentBids.length === 0 ? (
          <div className="p-6 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] text-center text-slate-400 dark:text-slate-500 text-xs">
            <p>No bids recorded for this lot yet.</p>
            <p className="text-[11px] mt-1 text-slate-400 dark:text-slate-600">
              Offers placed by investor teams will appear here in real time with sequence numbers.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {recentBids.map((b, idx) => {
              const isTop = idx === 0 && (b.status === 'WINNING' || b.status === 'SETTLED');
              return (
                <div
                  key={b.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                    isTop
                      ? 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-slate-900 dark:text-white font-medium'
                      : 'bg-white dark:bg-[#0A1124] border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-7 tabular-nums">
                      #{b.server_seq}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {b.bidder_profile?.team_name || 'Investor Team'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({b.bidder_profile?.display_user_id})
                        </span>
                        {isTop && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                            · Current Lead
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                        ₹{Number(b.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block capitalize">
                        {b.status.toLowerCase()}
                      </span>
                    </div>

                    {['WINNING', 'ACTIVE'].includes(b.status) && (
                      <button
                        onClick={() => setTargetVoidBidId(b.id)}
                        title="Void this bid in case of misclick or dispute"
                        className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-200 dark:border-rose-500/30 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        Void
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Void confirmation modal */}
        {targetVoidBidId && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/50 space-y-3">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-200 block">
              Confirm Bid Invalidation / Void:
            </span>
            <input
              type="text"
              placeholder="Reason (e.g. misclick, stage dispute, network lag)"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-white dark:bg-navy-950 border border-rose-300 dark:border-rose-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setTargetVoidBidId(null)}
                className="px-3 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVoidBid(targetVoidBidId)}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
              >
                Confirm Invalidation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
