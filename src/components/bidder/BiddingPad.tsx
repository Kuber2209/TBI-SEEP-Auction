'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { submitBidAction } from '@/lib/auction/actions';
import { BidderWallet, Profile, Startup } from '@/lib/supabase/types';
import { ConnectionStatus } from '@/hooks/useAuctionSync';
import { ValuationCalculator } from './ValuationCalculator';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
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
  const [passAcknowledged, setPassAcknowledged] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');

  const isBiddingOpen = startup?.status === 'ACTIVE_BIDDING';
  const isConnected = connectionStatus === 'CONNECTED';
  const isCurrentlyWinning = Boolean(
    profile && startup?.current_highest_bidder_id === profile.id && isBiddingOpen
  );
  const currentBid = startup?.current_highest_bid || null;
  const basePrice = startup?.base_price || 0;
  const availableBalance = wallet?.available_balance || 0;

  // Screen reader announcements
  const prevBidRef = useRef<number | null>(currentBid);
  useEffect(() => {
    if (currentBid !== prevBidRef.current) {
      if (currentBid !== null) {
        if (isCurrentlyWinning) {
          setSrAnnouncement(
            `Your team holds the highest bid at ₹${currentBid.toLocaleString('en-IN')}.`
          );
        } else {
          setSrAnnouncement(
            `New highest bid placed: ₹${currentBid.toLocaleString('en-IN')}.`
          );
        }
      } else {
        setSrAnnouncement(`Opening base floor: ₹${basePrice.toLocaleString('en-IN')}.`);
      }
      prevBidRef.current = currentBid;
    }
  }, [currentBid, isCurrentlyWinning, basePrice]);

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
        const errorText = `Insufficient purse: Available balance is ₹${availableBalance.toLocaleString('en-IN')}`;
        setErrorMessage(errorText);
        setSrAnnouncement(errorText);
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setPassAcknowledged(false);
      setSrAnnouncement(`Submitting bid for ₹${amount.toLocaleString('en-IN')}...`);

      const idempotencyKey = crypto.randomUUID();

      try {
        const res = await submitBidAction(startup.id, amount, idempotencyKey);

        if (!res.success) {
          const failMsg = res.error || 'Bid rejected by server.';
          setErrorMessage(failMsg);
          setSrAnnouncement(`Bid submission failed: ${failMsg}`);
        } else {
          setSrAnnouncement(`Bid successfully accepted for ₹${amount.toLocaleString('en-IN')}.`);
          try {
            confetti({
              particleCount: 35,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#F59E0B', '#10B981', '#38BDF8'],
            });
          } catch (e) {}

          if (onBidSuccess) onBidSuccess();
        }
      } catch (err: any) {
        const netErrMsg = err.message || 'Network error submitting bid';
        setErrorMessage(netErrMsg);
        setSrAnnouncement(`Network error: ${netErrMsg}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [startup, profile, isSubmitting, isBiddingOpen, isCurrentlyWinning, availableBalance, onBidSuccess]
  );

  // Keyboard Hotkeys: 1, 2, 3, 4 for increments, Space for Pass
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || target.isContentEditable) {
        return;
      }

      if (isBiddingOpen && !isCurrentlyWinning && !isSubmitting) {
        if ((e.key === '1' || e.code === 'Digit1') && bidOptions[0]) {
          e.preventDefault();
          handlePlaceBid(bidOptions[0]);
        } else if ((e.key === '2' || e.code === 'Digit2') && bidOptions[1]) {
          e.preventDefault();
          handlePlaceBid(bidOptions[1]);
        } else if ((e.key === '3' || e.code === 'Digit3') && bidOptions[2]) {
          e.preventDefault();
          handlePlaceBid(bidOptions[2]);
        } else if ((e.key === '4' || e.code === 'Digit4') && bidOptions[3]) {
          e.preventDefault();
          handlePlaceBid(bidOptions[3]);
        }
      }

      if (e.code === 'Space' && isBiddingOpen && !['BUTTON', 'A'].includes(tagName)) {
        e.preventDefault();
        setPassAcknowledged((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBiddingOpen, isCurrentlyWinning, isSubmitting, bidOptions, handlePlaceBid]);

  return (
    <div className="rounded-xl p-6 sm:p-8 bg-white dark:bg-[#0F131D] border border-slate-200/80 dark:border-white/[0.06] flex flex-col justify-between h-full transition-colors duration-150">
      {/* Screen Reader Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {srAnnouncement}
      </div>

      <div className="space-y-6">
        {/* Primary Focal Point: Current Offer & Status (No box inside box) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentBid !== null ? 'Current Highest Offer' : 'Floor Reserve'}
            </span>
            {isCurrentlyWinning ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Your Team Leading
              </span>
            ) : isBiddingOpen ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Live Round Active
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {startup?.status === 'PRESENTING' ? 'Pitch in Progress' : 'Standby'}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 dark:text-white tracking-tight tabular-nums">
              ₹{Number(currentBid || basePrice).toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currentBid !== null
              ? isCurrentlyWinning
                ? 'Your capital is held in escrow until outbid or lot closes.'
                : 'Offer submitted by competing syndicate.'
              : 'Opening lot valuation. Ready to receive initial bids.'}
          </p>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" strokeWidth={1.75} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Available Bid Actions: 4 Integrated Increment Buttons */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-medium">Place Next Bid</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Keys 1 – 4</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {bidOptions.map((optAmount, idx) => {
              const diff = currentBid ? optAmount - currentBid : optAmount - basePrice;
              const hasEnoughFunds = availableBalance >= optAmount;
              const shortcutKey = String(idx + 1);
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
                  aria-keyshortcuts={shortcutKey}
                  aria-label={`Place bid for ₹${optAmount.toLocaleString('en-IN')}`}
                  className={`group relative p-3 sm:p-3.5 rounded-lg border text-left transition-colors duration-150 active:scale-[0.98] outline-none ${
                    isDisabled
                      ? 'bg-slate-50 dark:bg-navy-950/40 border-slate-200/60 dark:border-white/[0.04] text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                      : 'bg-white dark:bg-[#141A27] hover:bg-slate-50 dark:hover:bg-[#1A2234] border-slate-200 dark:border-white/[0.08] hover:border-amber-500/50 dark:hover:border-amber-500/50 text-slate-900 dark:text-white shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base sm:text-lg font-semibold tracking-tight tabular-nums">
                      ₹{optAmount.toLocaleString('en-IN')}
                    </span>
                    <ArrowUpRight
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isDisabled
                          ? 'text-slate-400'
                          : 'text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                      }`}
                      strokeWidth={2}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-medium tabular-nums">
                      {currentBid === null && optAmount === basePrice
                        ? 'Opening floor'
                        : `+₹${diff.toLocaleString('en-IN')}`}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      [{shortcutKey}]
                    </span>
                  </div>

                  {!hasEnoughFunds && isBiddingOpen && (
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block mt-1">
                      Exceeds purse
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progressive Disclosure: Valuation Modeler (Clean and Un-boxed) */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setShowValuationModal(!showValuationModal)}
            aria-expanded={showValuationModal}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 py-1 transition-colors"
          >
            <span>Valuation & Ownership Modeler</span>
            {showValuationModal ? (
              <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
          </button>

          {showValuationModal && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
              <ValuationCalculator
                activeAmount={currentBid || basePrice}
                currentBidAmount={currentBid || 0}
                basePrice={basePrice}
                bidOptions={bidOptions}
                currentHighestBid={currentBid}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer: Status / Pass Control (Quiet and understated) */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
        <button
          onClick={() => {
            setPassAcknowledged(!passAcknowledged);
            setSrAnnouncement(!passAcknowledged ? 'Pass active for this lot.' : 'Pass cleared.');
          }}
          disabled={!isBiddingOpen}
          aria-pressed={passAcknowledged}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors active:scale-[0.98] ${
            passAcknowledged
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
              : 'bg-transparent hover:bg-slate-50 dark:hover:bg-navy-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
          }`}
        >
          <span>{passAcknowledged ? 'Passed (Standing By)' : 'Pass Round'}</span>
          <span className="ml-1.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">[Space]</span>
        </button>

        {isSubmitting && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium" aria-live="polite">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Recording bid...</span>
          </span>
        )}
      </div>
    </div>
  );
}
