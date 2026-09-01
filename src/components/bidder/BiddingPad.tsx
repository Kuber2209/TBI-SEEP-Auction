'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { submitBidAction } from '@/lib/auction/actions';
import { BidderWallet, Profile, Startup } from '@/lib/supabase/types';
import { ConnectionStatus } from '@/hooks/useAuctionSync';
import { ValuationCalculator } from './ValuationCalculator';
import {
  Trophy,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  Flame,
  Check,
  Ban,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
  const [lastSubmittedBid, setLastSubmittedBid] = useState<number | null>(null);
  const [passAcknowledged, setPassAcknowledged] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);

  const isBiddingOpen = startup?.status === 'ACTIVE_BIDDING';
  const isConnected = connectionStatus === 'CONNECTED';
  const isCurrentlyWinning = Boolean(
    profile && startup?.current_highest_bidder_id === profile.id && isBiddingOpen
  );
  const currentBid = startup?.current_highest_bid || null;
  const basePrice = startup?.base_price || 0;
  const availableBalance = wallet?.available_balance || 0;

  // Calculate dynamic bid options
  const calculateBidOptions = useCallback((): number[] => {
    if (!startup) return [];

    if (!currentBid) {
      const options = [basePrice];
      increments.forEach((inc) => {
        options.push(basePrice + inc);
      });
      return Array.from(new Set(options)).slice(0, 4);
    } else {
      return increments.map((inc) => currentBid + inc);
    }
  }, [startup, currentBid, basePrice, increments]);

  const bidOptions = calculateBidOptions();

  const handlePlaceBid = useCallback(
    async (amount: number) => {
      if (!startup || !profile || isSubmitting || !isBiddingOpen || isCurrentlyWinning) return;

      if (amount > availableBalance) {
        setErrorMessage(`Insufficient funds: Available purse is ₹${availableBalance.toLocaleString('en-IN')}`);
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setLastSubmittedBid(amount);
      setPassAcknowledged(false);

      const idempotencyKey = crypto.randomUUID();

      try {
        const res = await submitBidAction(startup.id, amount, idempotencyKey);

        if (!res.success) {
          setErrorMessage(res.error || 'Bid rejected by server.');
        } else {
          try {
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.65 },
              colors: ['#F59E0B', '#D97706', '#10B981', '#38BDF8'],
            });
          } catch (e) {}

          if (onBidSuccess) onBidSuccess();
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Network error while submitting bid');
      } finally {
        setIsSubmitting(false);
      }
    },
    [startup, profile, isSubmitting, isBiddingOpen, isCurrentlyWinning, availableBalance, onBidSuccess]
  );

  // Keyboard Hotkey Support (1, 2, 3, 4 for increments, Space for Pass)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (isBiddingOpen && !isCurrentlyWinning && !isSubmitting) {
        if (e.key === '1' && bidOptions[0]) {
          handlePlaceBid(bidOptions[0]);
        } else if (e.key === '2' && bidOptions[1]) {
          handlePlaceBid(bidOptions[1]);
        } else if (e.key === '3' && bidOptions[2]) {
          handlePlaceBid(bidOptions[2]);
        } else if (e.key === '4' && bidOptions[3]) {
          handlePlaceBid(bidOptions[3]);
        }
      }

      if (e.key === ' ' && isBiddingOpen) {
        e.preventDefault();
        setPassAcknowledged((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBiddingOpen, isCurrentlyWinning, isSubmitting, bidOptions, handlePlaceBid]);

  return (
    <div
      className={`glass-card rounded-3xl p-6 sm:p-7 lg:p-8 relative border transition-all duration-300 flex flex-col justify-between h-full shadow-2xl ${
        isCurrentlyWinning
          ? 'emerald-border-glow bg-emerald-950/20'
          : isBiddingOpen
          ? 'gold-border-glow bg-navy-900/60'
          : 'border-navy-800/80 bg-navy-900/40'
      }`}
    >
      <div>
        {/* Top Status Alert / Leader Banner */}
        {isCurrentlyWinning ? (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 flex items-center justify-between shadow-emerald animate-glow-emerald">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-navy-950 flex items-center justify-center font-black">
                <Trophy className="w-4 h-4 text-navy-950" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-display font-black tracking-wide uppercase block">
                  Your Team Holds Highest Bid!
                </span>
                <span className="text-[11px] text-emerald-300/80 font-medium">
                  Leading lot allocation at ₹{Number(currentBid).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          </div>
        ) : isBiddingOpen ? (
          <div className="mb-5 p-4 rounded-2xl bg-gold-500/15 border border-gold-500/40 text-gold-200 flex items-center justify-between shadow-gold animate-glow-gold">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gold-500 text-navy-950 flex items-center justify-center font-black">
                <Flame className="w-4 h-4 text-navy-950" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-display font-black tracking-wide uppercase block">
                  Live Bidding Open!
                </span>
                <span className="text-[11px] text-gold-300/80 font-medium">
                  Select your bid increment below (Hotkeys: 1, 2, 3, 4)
                </span>
              </div>
            </div>
            <span className="w-3 h-3 rounded-full bg-gold-400 animate-ping" />
          </div>
        ) : (
          <div className="mb-5 p-3.5 rounded-2xl bg-navy-950/80 border border-navy-800 text-slate-400 flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="font-medium">
              {startup?.status === 'PRESENTING'
                ? 'Pitch in progress on stage. Bidding pad will unlock momentarily.'
                : startup?.status === 'SOLD'
                ? 'This startup round has concluded and settled.'
                : startup?.status === 'PAUSED'
                ? 'Auctioneer has temporarily paused bidding.'
                : 'Awaiting round commencement from stage.'}
            </span>
          </div>
        )}

        {/* Big Current Highest Bid Metric */}
        <div className="text-center py-5 sm:py-6 bg-navy-950/80 rounded-2xl border border-navy-800/80 mb-5 shadow-inner relative overflow-hidden">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
            Current Highest Offer
          </span>
          <div className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span className="text-gold-500 font-sans">₹</span>
            <span>
              {currentBid !== null
                ? Number(currentBid).toLocaleString('en-IN')
                : Number(basePrice).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {currentBid !== null
              ? isCurrentlyWinning
                ? '👑 Held by Your Team'
                : 'Held by Competing Investor Team'
              : 'Opening Base Floor (No bids placed yet)'}
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dynamic Bid Increment Buttons Pad */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Dynamic Bid Increments</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Hotkeys: [1], [2], [3], [4]
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {bidOptions.map((optAmount, idx) => {
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
                  className={`relative p-4 sm:p-4.5 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 active:scale-95 group overflow-hidden ${
                    isDisabled
                      ? 'bg-navy-950/50 border-navy-800/80 text-slate-500 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-b from-navy-800 via-navy-850 to-navy-900 hover:from-gold-600 hover:via-gold-500 hover:to-amber-500 border-navy-700 hover:border-gold-400 text-white hover:text-navy-950 shadow-md hover:shadow-gold-lg glass-card-interactive'
                  }`}
                >
                  <div className="flex items-center gap-1 font-display font-black text-lg sm:text-xl tracking-tight">
                    <span>₹{optAmount.toLocaleString('en-IN')}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 group-hover:-translate-y-1 transition duration-150" />
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-navy-950/70 text-gold-400 border border-navy-700">
                      [{idx + 1}]
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold opacity-80">
                      {currentBid === null && optAmount === basePrice
                        ? 'Opening Floor'
                        : `+ ₹${diff.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  {!hasEnoughFunds && isBiddingOpen && (
                    <span className="text-[9px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full mt-1.5">
                      Exceeds Purse
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Valuation Modeler */}
        <div className="pt-2 border-t border-navy-800/80">
          <button
            type="button"
            onClick={() => setShowValuationModal(!showValuationModal)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-gold-400 py-1.5 transition"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-gold-400" />
              <span>Valuation & Equity Modeler</span>
            </div>
            {showValuationModal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showValuationModal && (
            <div className="mt-3 animate-fade-in">
              <ValuationCalculator
                currentBidAmount={currentBid || 0}
                basePrice={basePrice}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer / Pass & Status Feedback */}
      <div className="mt-5 pt-4 border-t border-navy-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPassAcknowledged(!passAcknowledged)}
            disabled={!isBiddingOpen}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              passAcknowledged
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-navy-900 hover:bg-navy-800 text-slate-400 hover:text-slate-200 border-navy-800'
            }`}
          >
            {passAcknowledged ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Ban className="w-3.5 h-3.5" />}
            <span>{passAcknowledged ? 'Pass Active (Standing By)' : 'Pass Round (Space)'}</span>
          </button>
        </div>

        {isSubmitting && (
          <span className="flex items-center gap-2 text-gold-400 font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Transacting on Ledger...</span>
          </span>
        )}
      </div>
    </div>
  );
}
