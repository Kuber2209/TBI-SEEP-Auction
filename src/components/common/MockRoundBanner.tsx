'use client';

import React from 'react';
import { FlaskConical } from 'lucide-react';

interface MockRoundBannerProps {
  purseAmount?: number;
}

/**
 * Sticky banner shown to bidders when the active session is a rehearsal/mock round.
 * Makes it crystal clear that bids are practice-only and won't affect real purse.
 */
export function MockRoundBanner({ purseAmount }: MockRoundBannerProps) {
  return (
    <div className="w-full bg-amber-400 border-b border-amber-500 px-4 py-2 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 flex-wrap text-center">
        <FlaskConical className="w-4 h-4 text-amber-900 shrink-0" strokeWidth={2} />
        <span className="text-xs sm:text-sm font-bold text-amber-900 tracking-wide uppercase">
          🎭 Mock Round — Practice Only
        </span>
        <span className="text-amber-800 text-xs font-medium hidden sm:inline">·</span>
        <span className="text-amber-900 text-xs sm:text-sm font-medium">
          Bids do not count. Your real purse is safe.
          {purseAmount !== undefined && (
            <span className="ml-1 font-semibold">
              Demo purse: ₹{Number(purseAmount).toLocaleString('en-IN')}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
