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
    <div className="rounded-xl p-6 sm:p-8 bg-[#f9f8f6] border border-[#e2e5ea] shadow-sm flex flex-col justify-between h-full transition-colors duration-150">
      {/* Screen Reader Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {srAnnouncement}
      </div>

      <div className="space-y-6">
        {/* Primary Focal Point: Current Offer & Status */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs text-[#6b7a8d] font-medium">
              {currentBid !== null ? 'Current Highest Offer' : 'Floor Reserve'}
            </span>
            {isCurrentlyWinning ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Your Team Leading
              </span>
            ) : isBiddingOpen ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a5c3e] bg-[#1a5c3e]/10 px-2.5 py-0.5 rounded-md border border-[#1a5c3e]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a5c3e] animate-pulse" />
                Live Round Active
              </span>
            ) : (
              <span className="text-xs text-[#6b7a8d] font-medium">
                {startup?.status === 'PRESENTING' ? 'Pitch in Progress' : 'Standby'}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#33404f] tracking-tight font-mono tabular-nums">
              ₹{Number(currentBid || basePrice).toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-xs text-[#6b7a8d] mt-1">
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
            className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" strokeWidth={1.75} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Available Bid Actions: 4 Integrated Increment Buttons */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#6b7a8d] mb-2.5">
            <span className="font-semibold text-[#33404f]">Place Next Bid</span>
            <span className="text-[11px] text-[#6b7a8d]">Keys 1 – 4</span>
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
                  className={`group relative p-3 sm:p-3.5 rounded-md border text-left transition-colors duration-150 active:scale-[0.98] outline-none ${
                    isDisabled
                      ? 'bg-[#f1f4f7] border-[#e2e5ea] text-[#6b7a8d] cursor-not-allowed opacity-50'
                      : 'bg-[#f9f8f6] hover:bg-white border-[#e2e5ea] hover:border-[#1a5c3e] text-[#33404f] shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base sm:text-lg font-semibold tracking-tight font-mono tabular-nums text-[#33404f]">
                      ₹{optAmount.toLocaleString('en-IN')}
                    </span>
                    <ArrowUpRight
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isDisabled
                          ? 'text-[#6b7a8d]'
                          : 'text-[#1a5c3e] group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                      }`}
                      strokeWidth={2}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mt-0.5 text-[#6b7a8d]">
                    <span className="text-[11px] font-medium font-mono tabular-nums">
                      {currentBid === null && optAmount === basePrice
                        ? 'Opening floor'
                        : `+₹${diff.toLocaleString('en-IN')}`}
                    </span>
                    <span className="font-mono text-[10px] text-[#6b7a8d]">
                      [{shortcutKey}]
                    </span>
                  </div>

                  {!hasEnoughFunds && isBiddingOpen && (
                    <span className="text-[10px] text-red-700 font-medium block mt-1">
                      Exceeds purse
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progressive Disclosure: Valuation Modeler */}
        <div className="pt-3 border-t border-[#e2e5ea]">
          <button
            type="button"
            onClick={() => setShowValuationModal(!showValuationModal)}
            aria-expanded={showValuationModal}
            className="w-full flex items-center justify-between text-xs font-medium text-[#6b7a8d] hover:text-[#33404f] py-1 transition-colors"
          >
            <span>Valuation & Ownership Modeler</span>
            {showValuationModal ? (
              <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
          </button>

          {showValuationModal && (
            <div className="mt-3 pt-3 border-t border-[#e2e5ea]">
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

      {/* Footer: Status / Pass Control */}
      <div className="mt-6 pt-4 border-t border-[#e2e5ea] flex items-center justify-between text-xs">
        <button
          onClick={() => {
            setPassAcknowledged(!passAcknowledged);
            setSrAnnouncement(!passAcknowledged ? 'Pass active for this lot.' : 'Pass cleared.');
          }}
          disabled={!isBiddingOpen}
          aria-pressed={passAcknowledged}
          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors active:scale-[0.98] ${
            passAcknowledged
              ? 'bg-[#e2e5ea] text-[#33404f] border-[#cbd5e1]'
              : 'bg-[#f1f4f7] hover:bg-white text-[#6b7a8d] hover:text-[#33404f] border-[#e2e5ea]'
          }`}
        >
          <span>{passAcknowledged ? 'Passed (Standing By)' : 'Pass Round'}</span>
          <span className="ml-1.5 font-mono text-[10px] text-[#6b7a8d]">[Space]</span>
        </button>

        {isSubmitting && (
          <span className="flex items-center gap-1.5 text-xs text-[#1a5c3e] font-medium" aria-live="polite">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Recording bid...</span>
          </span>
        )}
      </div>
    </div>
  );
}
