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
  CheckCircle2,
  Flame,
  ShieldCheck,
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
      <div className="glass-card rounded-[24px] p-8 text-center flex flex-col items-center justify-center min-h-[320px] border-white/[0.07]">
        <Radio className="w-12 h-12 text-navy-700 mb-3 animate-pulse" />
        <h3 className="text-xl font-display font-bold text-white">No Active Startup Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Select a startup from the presentation queue to begin driver orchestration.
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
    setLoadingAction(`void_${bidId}`);
    setActionError(null);
    try {
      const res = await voidBidAction(bidId, voidReason || 'Admin voided');
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

  const handleAdvanceNext = () => {
    const currentIndex = startups.findIndex((s) => s.id === activeStartup.id);
    if (currentIndex < startups.length - 1) {
      const nextStartup = startups[currentIndex + 1];
      onSelectStartup(nextStartup);
      handleSetStatus('PRESENTING');
    }
  };

  return (
    <div className="glass-card rounded-[24px] p-6 sm:p-7 lg:p-8 border border-white/[0.07] shadow-sm space-y-6">
      {/* Active Lot Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-lg bg-gold-500/20 text-gold-400 font-mono text-xs font-black border border-gold-500/30 shadow-sm">
              LOT #{activeStartup.display_order}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
              {activeStartup.name}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {activeStartup.sector} · Floor: ₹{Number(activeStartup.base_price).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
              activeStartup.status === 'ACTIVE_BIDDING'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm animate-pulse'
                : activeStartup.status === 'PRESENTING'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : activeStartup.status === 'PAUSED'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : activeStartup.status === 'SOLD'
                ? 'bg-gold-500/25 text-gold-300 border border-gold-500/50 shadow-sm'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {activeStartup.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-[16px] bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Stage Action Controls Grid */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Live Stage Workflow Orchestration
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* 1. Set Presenting */}
          <button
            onClick={() => handleSetStatus('PRESENTING')}
            disabled={Boolean(loadingAction) || activeStartup.status === 'PRESENTING'}
            className="p-4 rounded-[16px] bg-navy-900 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-2 border border-navy-700 hover:border-blue-400 transition shadow-md active:scale-[0.98] group"
          >
            <Radio className="w-5 h-5 text-blue-400 group-hover:scale-110 transition" />
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
            className="p-4 rounded-[16px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-2 border border-emerald-500 shadow-sm transition active:scale-[0.98] group"
          >
            {loadingAction === 'status_ACTIVE_BIDDING' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Flame className="w-5 h-5 group-hover:scale-110 transition" />
            )}
            <span>2. Open Bidding</span>
          </button>

          {/* Pause / Resume */}
          {activeStartup.status === 'PAUSED' ? (
            <button
              onClick={() => handleSetStatus('ACTIVE_BIDDING')}
              disabled={Boolean(loadingAction)}
              className="p-4 rounded-[16px] bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-2 border border-amber-400 shadow-md transition active:scale-[0.98]"
            >
              <Play className="w-5 h-5" />
              <span>Resume Bidding</span>
            </button>
          ) : (
            <button
              onClick={() => handleSetStatus('PAUSED')}
              disabled={Boolean(loadingAction) || activeStartup.status !== 'ACTIVE_BIDDING'}
              className="p-4 rounded-[16px] bg-navy-900 hover:bg-amber-700/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-2 border border-navy-700 transition active:scale-[0.98]"
            >
              <Pause className="w-5 h-5 text-amber-400" />
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
            className="p-4 rounded-[16px] bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-2 border border-gold-400 shadow-sm transition active:scale-[0.98] group"
          >
            {loadingAction === 'close' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Gavel className="w-5 h-5 group-hover:rotate-12 transition" />
            )}
            <span>3. Close (Settle)</span>
          </button>

          {/* Reopen Auction */}
          <button
            onClick={handleReopenAuction}
            disabled={Boolean(loadingAction) || !['SOLD', 'UNSOLD'].includes(activeStartup.status)}
            className="p-4 rounded-[16px] bg-navy-900 hover:bg-purple-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-2 border border-navy-700 transition active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5 text-purple-400" />
            <span>Reopen Round</span>
          </button>

          {/* 4. Advance Next */}
          <button
            onClick={handleAdvanceNext}
            disabled={Boolean(loadingAction) || activeStartup.status !== 'SOLD'}
            className="p-3.5 sm:p-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-white font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-white/[0.08] transition active:scale-[0.98] group"
          >
            <SkipForward className="w-5 h-5 text-blue-500 dark:text-blue-400 group-hover:translate-x-0.5 transition" strokeWidth={1.75} />
            <span>4. Next Lot</span>
          </button>
        </div>
      </div>

      {/* Live Highest Bid Monitor & Void Actions */}
      <div className="p-5 rounded-[16px] bg-navy-950/80 border border-white/[0.07] shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
            Active Highest Bid Leader
          </span>
          {activeStartup.current_highest_bid !== null && (
            <span className="font-semibold text-xl text-gold-400">
              ₹{Number(activeStartup.current_highest_bid).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {recentBids.length > 0 && (
          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {recentBids.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-[12px] bg-navy-900 border border-white/[0.07] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white mr-2">
                    {b.bidder_profile?.team_name || 'Team'}
                  </span>
                  <span className="font-mono font-black text-gold-400">
                    ₹{Number(b.amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono ml-2">
                    ({b.status})
                  </span>
                </div>

                {['WINNING', 'ACTIVE'].includes(b.status) && (
                  <button
                    onClick={() => setTargetVoidBidId(b.id)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Void Bid
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Void confirmation popup */}
        {targetVoidBidId && (
          <div className="mt-4 p-4 rounded-[16px] bg-rose-950/70 border border-rose-500/50 space-y-3 animate-fade-in">
            <span className="text-xs font-bold text-rose-300 block">
              Confirm Bid Invalidation / Void:
            </span>
            <input
              type="text"
              placeholder="Reason for voiding (e.g., misclick, network dispute)"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-[12px] bg-navy-950 border border-navy-700 text-xs text-white placeholder:text-slate-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setTargetVoidBidId(null)}
                className="px-3.5 py-1.5 rounded-[12px] bg-navy-800 text-xs font-semibold text-slate-300 hover:bg-navy-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVoidBid(targetVoidBidId)}
                className="px-4 py-1.5 rounded-[12px] bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-md"
              >
                Confirm Void Bid
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
