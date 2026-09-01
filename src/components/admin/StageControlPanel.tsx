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
      <div className="glass-card rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Radio className="w-12 h-12 text-navy-700 mb-3" />
        <h3 className="text-lg font-bold text-white">No Active Startup Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Select a startup from the queue to start presentation and live auction driver.
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
    <div className="glass-card rounded-2xl p-6 lg:p-7 border border-navy-800 space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-gold-500/20 text-gold-400 font-mono text-xs font-bold">
              LOT #{activeStartup.display_order}
            </span>
            <h2 className="text-xl lg:text-2xl font-bold text-white">
              {activeStartup.name}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">{activeStartup.sector} · Base: ₹{Number(activeStartup.base_price).toLocaleString('en-IN')}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              activeStartup.status === 'ACTIVE_BIDDING'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : activeStartup.status === 'PRESENTING'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : activeStartup.status === 'PAUSED'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : activeStartup.status === 'SOLD'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {activeStartup.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Stage Action Controls Grid */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Primary Stage Operations
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Presenting Button */}
          <button
            onClick={() => handleSetStatus('PRESENTING')}
            disabled={Boolean(loadingAction) || activeStartup.status === 'PRESENTING'}
            className="p-3.5 rounded-xl bg-navy-800 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-navy-700 transition"
          >
            <Radio className="w-5 h-5 text-blue-400" />
            <span>1. Set Presenting</span>
          </button>

          {/* Start Bidding Button */}
          <button
            onClick={() => handleSetStatus('ACTIVE_BIDDING')}
            disabled={Boolean(loadingAction) || activeStartup.status === 'ACTIVE_BIDDING' || activeStartup.status === 'SOLD'}
            className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-emerald-500 shadow-md transition"
          >
            {loadingAction === 'status_ACTIVE_BIDDING' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>2. Start Live Bidding</span>
          </button>

          {/* Pause / Resume Button */}
          {activeStartup.status === 'PAUSED' ? (
            <button
              onClick={() => handleSetStatus('ACTIVE_BIDDING')}
              disabled={Boolean(loadingAction)}
              className="p-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-amber-400 transition"
            >
              <Play className="w-5 h-5" />
              <span>Resume Bidding</span>
            </button>
          ) : (
            <button
              onClick={() => handleSetStatus('PAUSED')}
              disabled={Boolean(loadingAction) || activeStartup.status !== 'ACTIVE_BIDDING'}
              className="p-3.5 rounded-xl bg-navy-800 hover:bg-amber-700/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-navy-700 transition"
            >
              <Pause className="w-5 h-5 text-amber-400" />
              <span>Pause Bidding</span>
            </button>
          )}

          {/* Close Auction Button */}
          <button
            onClick={handleCloseAuction}
            disabled={
              Boolean(loadingAction) ||
              !['ACTIVE_BIDDING', 'PAUSED'].includes(activeStartup.status)
            }
            className="p-3.5 rounded-xl bg-gold-600 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-black text-xs flex flex-col items-center justify-center gap-1.5 border border-gold-400 shadow-gold transition"
          >
            {loadingAction === 'close' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Gavel className="w-5 h-5" />
            )}
            <span>3. Close Auction (Settle)</span>
          </button>

          {/* Reopen Auction Button */}
          <button
            onClick={handleReopenAuction}
            disabled={Boolean(loadingAction) || !['SOLD', 'UNSOLD'].includes(activeStartup.status)}
            className="p-3.5 rounded-xl bg-navy-800 hover:bg-purple-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-navy-700 transition"
          >
            <RotateCcw className="w-5 h-5 text-purple-400" />
            <span>Reopen Round</span>
          </button>

          {/* Advance Next Button */}
          <button
            onClick={handleAdvanceNext}
            disabled={Boolean(loadingAction) || activeStartup.status !== 'SOLD'}
            className="p-3.5 rounded-xl bg-navy-800 hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-navy-700 transition"
          >
            <SkipForward className="w-5 h-5 text-seep-sky" />
            <span>4. Next Startup ➡️</span>
          </button>
        </div>
      </div>

      {/* Live Highest Bid Monitor & Void Management */}
      <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Highest Bid Leader
          </span>
          {activeStartup.current_highest_bid !== null && (
            <span className="font-mono text-lg font-black text-gold-400">
              ₹{Number(activeStartup.current_highest_bid).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {recentBids.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentBids.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="p-2 rounded-lg bg-navy-900 border border-navy-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white mr-2">
                    {b.bidder_profile?.team_name || 'Team'}
                  </span>
                  <span className="font-mono text-gold-400">
                    ₹{Number(b.amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono ml-2">
                    ({b.status})
                  </span>
                </div>

                {['WINNING', 'ACTIVE'].includes(b.status) && (
                  <button
                    onClick={() => setTargetVoidBidId(b.id)}
                    className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Void Bid
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Void confirmation modal */}
        {targetVoidBidId && (
          <div className="mt-3 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 space-y-2">
            <span className="text-xs font-bold text-rose-300 block">
              Confirm Bid Void / Cancellation:
            </span>
            <input
              type="text"
              placeholder="Reason (e.g. Bidder misclick, operator correction)"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-navy-950 border border-navy-700 text-xs text-white"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setTargetVoidBidId(null)}
                className="px-3 py-1 rounded bg-navy-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVoidBid(targetVoidBidId)}
                className="px-3 py-1 rounded bg-rose-600 text-xs font-bold text-white hover:bg-rose-500"
              >
                Confirm Void
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
