'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Startup } from '@/lib/supabase/types';

interface Props {
  startup: Startup | null;
  recentBids: any[];
}

export function DashboardBidDisplay({ startup, recentBids }: Props) {
  const [bump, setBump] = useState(false);
  const prevBid = useRef<number | null>(null);

  const currentBid = startup?.current_highest_bid ?? null;
  const leadingTeam = startup?.highest_bidder_team_name ?? null;
  const floor = startup?.base_price ?? 0;
  const displayAmount = currentBid ?? floor;

  const prevStartupId = useRef<string | null | undefined>(null);

  // Single effect to handle both lot-change reset and bid-bump animation
  // Order matters: always check for lot change first to avoid stale-ref comparisons
  useEffect(() => {
    const lotChanged = startup?.id !== prevStartupId.current;

    if (lotChanged) {
      // Reset everything cleanly when switching lots
      prevStartupId.current = startup?.id ?? null;
      prevBid.current = currentBid;
      setBump(false);
      return;
    }

    // Same lot — check if bid increased
    if (
      currentBid !== null &&
      prevBid.current !== null &&
      currentBid > prevBid.current
    ) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 700);
      prevBid.current = currentBid;
      return () => clearTimeout(t);
    }

    prevBid.current = currentBid;
  }, [startup?.id, currentBid]);

  const bidCount = recentBids.length;

  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-2">
        <span className="text-5xl font-black text-[#cad7cc] font-mono tabular-nums">₹ —</span>
        <span className="text-[#8a9a8f] text-xs font-mono uppercase tracking-widest font-semibold">
          No Active Bidding Round
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
      {/* Live / floor label */}
      <div className="flex items-center gap-2">
        {currentBid !== null ? (
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#1a5c3e]">
            Current Highest Offer
          </span>
        ) : (
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#56695e]">
            Floor Reserve Floor
          </span>
        )}
        {currentBid !== null && (
          <span className="text-xs font-mono text-[#8a9a8f] font-medium">
            · {bidCount} bid{bidCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Big ₹ amount */}
      <div
        className={`font-black font-mono tabular-nums leading-none tracking-tight transition-all duration-200 ${
          bump
            ? 'text-[#1a5c3e] scale-105 drop-shadow-[0_4px_24px_rgba(26,92,62,0.22)]'
            : currentBid !== null
            ? 'text-[#1a5c3e] scale-100'
            : 'text-[#203126] scale-100'
        }`}
        style={{ fontSize: 'clamp(2.75rem, 6vw, 5.5rem)' }}
      >
        ₹{Number(displayAmount).toLocaleString('en-IN')}
      </div>

      {/* Leading team */}
      {currentBid !== null && leadingTeam ? (
        <div className="flex items-center gap-2.5 mt-1 px-5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
            Leading Bidder:
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#1a5c3e] tracking-tight">
            {leadingTeam}
          </span>
        </div>
      ) : currentBid === null ? (
        <span className="text-[#8a9a8f] text-xs font-mono italic">
          Awaiting opening offer from investor teams…
        </span>
      ) : null}
    </div>
  );
}
