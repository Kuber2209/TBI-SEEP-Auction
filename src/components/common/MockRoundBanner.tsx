'use client';

import React from 'react';
import { FlaskConical } from 'lucide-react';

interface MockRoundBannerProps {
  purseAmount?: number;
}

/**
 * Sticky banner shown to bidders when the active session is a rehearsal/mock round.
 * Harmonized with the institutional sage & forest-green design language.
 */
export function MockRoundBanner({ purseAmount }: MockRoundBannerProps) {
  return (
    <div className="w-full bg-[#e8f1eb] border-b border-[#cad7cc] px-4 py-2 z-40 transition-colors duration-150 shadow-[0_1px_2px_rgba(32,49,38,0.03)]">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#1a5c3e] text-white shadow-xs">
          <FlaskConical className="w-3.5 h-3.5" strokeWidth={2} />
          Mock Round
        </span>
        <span className="text-[#88998c] text-xs font-medium hidden sm:inline">·</span>
        <span className="text-xs sm:text-sm text-[#203126] font-medium">
          Practice session only — bids placed here will not affect your official capital.
        </span>
        {purseAmount !== undefined && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-[#cad7cc] text-[11px] sm:text-xs font-semibold text-[#1a5c3e] font-mono tabular-nums shadow-2xs">
            Demo Purse: ₹{Number(purseAmount).toLocaleString('en-IN')}
          </span>
        )}
      </div>
    </div>
  );
}
