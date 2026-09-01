'use client';

import React, { useState } from 'react';
import { submitBidAction } from '@/lib/auction/actions';
import { BidderWallet, Profile, Startup } from '@/lib/supabase/types';
import { ConnectionStatus } from '@/hooks/useAuctionSync';
import { Trophy, TrendingUp, AlertTriangle, ShieldCheck, Loader2, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BiddingPadProps {
  startup: Startup | null;
  profile: Profile | null;
  wallet: BidderWallet | null;
  increments: number[];
  connectionStatus: ConnectionStatus;
  onBidSuccess?: () => void;
}

export function BiddingPad({
  startup,
  profile,
  wallet,
  increments = [1000, 2500, 5000, 10000],
  connectionStatus,
  onBidSuccess,
}: BiddingPadProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justBidAmount, setJustBidAmount] = useState<number | null>(null);

  const isBiddingOpen = startup?.status === 'ACTIVE_BIDDING';
  const isConnected = connectionStatus === 'CONNECTED';
  const isCurrentlyWinning = Boolean(
    profile && startup?.current_highest_bidder_id === profile.id && isBiddingOpen
  );
  const currentBid = startup?.current_highest_bid || null;
  const basePrice = startup?.base_price || 0;
  const availableBalance = wallet?.available_balance || 0;

  // Calculate dynamic bid options
  const calculateBidOptions = (): number[] => {
    if (!startup) return [];

    if (!currentBid) {
      // First bid options: base price + subsequent increments
      const options = [basePrice];
      increments.forEach((inc) => {
        options.push(basePrice + inc);
      });
      return Array.from(new Set(options)).slice(0, 4);
    } else {
      // Subsequent bid options: current bid + each increment
      return increments.map((inc) => currentBid + inc);
    }
  };

  const bidOptions = calculateBidOptions();

  const handlePlaceBid = async (amount: number) => {
    if (!startup || !profile || isSubmitting || !isBiddingOpen || isCurrentlyWinning) return;

    if (amount > availableBalance) {
      setErrorMessage(`Insufficient funds: Available purse is ₹${availableBalance.toLocaleString('en-IN')}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setJustBidAmount(amount);

    const idempotencyKey = crypto.randomUUID();

    try {
      const res = await submitBidAction(startup.id, amount, idempotencyKey);

      if (!res.success) {
        setErrorMessage(res.error || 'Bid rejected by server.');
      } else {
        // Trigger small celebration confetti
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#FFB703', '#FB8500', '#06D6A0'],
          });
        } catch (e) {}

        if (onBidSuccess) onBidSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while submitting bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`glass-card rounded-2xl p-6 lg:p-7 relative border transition-all duration-300 flex flex-col justify-between h-full ${
        isCurrentlyWinning
          ? 'green-border-glow bg-emerald-950/20'
          : isBiddingOpen
          ? 'gold-border-glow'
          : 'border-navy-800'
      }`}
    >
      <div>
        {/* Stage Status / Winning Alert */}
        {isCurrentlyWinning ? (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold tracking-wide uppercase">
                You are currently holding the highest bid!
              </span>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        ) : isBiddingOpen ? (
          <div className="mb-5 p-3 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold-400" />
              <span className="text-xs font-bold tracking-wide uppercase">
                Bidding is LIVE — Select your bid option below
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-navy-900 border border-navy-800 text-slate-400 flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              {startup?.status === 'PRESENTING'
                ? 'Pitch in progress on stage. Bidding will open shortly.'
                : startup?.status === 'SOLD'
                ? 'This startup round has concluded.'
                : startup?.status === 'PAUSED'
                ? 'Auctioneer has temporarily paused bidding.'
                : 'Awaiting round commencement.'}
            </span>
          </div>
        )}

        {/* Big Current Highest Bid Metric */}
        <div className="text-center py-4 bg-navy-950/70 rounded-2xl border border-navy-800/80 mb-6 shadow-inner">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
            Current Highest Bid
          </span>
          <div className="text-4xl lg:text-5xl font-mono font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span className="text-gold-500">₹</span>
            <span>
              {currentBid !== null
                ? Number(currentBid).toLocaleString('en-IN')
                : Number(basePrice).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {currentBid !== null
              ? isCurrentlyWinning
                ? 'Your Team holds this bid'
                : 'Held by opposing bidder team'
              : 'Opening Base Price (No bids placed yet)'}
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dynamic Bid Increment Buttons */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Available Bid Increments</span>
            <span className="text-[11px] text-slate-500 font-normal">
              One-click instantaneous submission
            </span>
          </span>

          <div className="grid grid-cols-2 gap-3">
            {bidOptions.map((optAmount) => {
              const diff = currentBid ? optAmount - currentBid : optAmount - basePrice;
              const hasEnoughFunds = availableBalance >= optAmount;
              const isDisabled =
                !isBiddingOpen ||
                !isConnected ||
                isCurrentlyWinning ||
                isSubmitting ||
                !hasEnoughFunds;

              return (
                <button
                  key={optAmount}
                  onClick={() => handlePlaceBid(optAmount)}
                  disabled={isDisabled}
                  className={`relative p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 active:scale-95 group ${
                    isDisabled
                      ? 'bg-navy-900/50 border-navy-800 text-slate-500 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-b from-navy-800 to-navy-850 hover:from-gold-600 hover:to-gold-500 border-navy-700 hover:border-gold-400 text-white hover:text-navy-950 shadow-md hover:shadow-gold'
                  }`}
                >
                  <div className="flex items-center gap-1 font-mono font-black text-lg tracking-tight">
                    <span>₹{optAmount.toLocaleString('en-IN')}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </div>

                  <span className="text-[11px] font-bold opacity-80 mt-0.5">
                    {currentBid === null && optAmount === basePrice
                      ? 'Opening Bid'
                      : `+ ₹${diff.toLocaleString('en-IN')}`}
                  </span>

                  {!hasEnoughFunds && isBiddingOpen && (
                    <span className="text-[9px] font-semibold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded mt-1">
                      Exceeds Purse
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info / Pass reminder */}
      <div className="mt-6 pt-4 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Pass is allowed — skip any round freely
        </span>
        {isSubmitting && (
          <span className="flex items-center gap-1.5 text-gold-400 font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Transacting...
          </span>
        )}
      </div>
    </div>
  );
}
