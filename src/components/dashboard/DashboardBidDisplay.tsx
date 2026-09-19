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
      <div className="flex flex-col items-center justify-center h-full min-h-[180px] gap-2">
        <span className="text-6xl font-black text-white/10 font-mono tabular-nums">₹ —</span>
        <span className="text-white/25 text-xs font-mono uppercase tracking-widest">No active lot</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      {/* Live / floor label */}
      <div className="flex items-center gap-2">
        {currentBid !== null ? (
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00ff88]/80">
            Current Highest Bid
          </span>
        ) : (
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">
            Floor Reserve Price
          </span>
        )}
        {currentBid !== null && (
          <span className="text-[10px] font-mono text-white/30">
            · {bidCount} bid{bidCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Big ₹ amount */}
      <div
        className={`font-black font-mono tabular-nums leading-none tracking-tight transition-all duration-300 ${
          bump
            ? 'text-[#00ff88] scale-110 drop-shadow-[0_0_32px_rgba(0,255,136,0.6)]'
            : currentBid !== null
            ? 'text-white scale-100'
            : 'text-white/30 scale-100'
        }`}
        style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
      >
        ₹{Number(displayAmount).toLocaleString('en-IN')}
      </div>

      {/* Leading team */}
      {currentBid !== null && leadingTeam ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
            Leading Bidder
          </span>
          <span className="text-2xl font-black text-[#00ff88] tracking-tight">
            {leadingTeam}
          </span>
        </div>
      ) : currentBid === null ? (
        <span className="text-white/30 text-sm font-mono italic">
          Awaiting opening offer…
        </span>
      ) : null}
    </div>
  );
}
