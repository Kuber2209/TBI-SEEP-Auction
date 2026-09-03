'use client';

import React from 'react';
import { Startup } from '@/lib/supabase/types';

interface StartupHeroProps {
  startup: Startup | null;
  totalLots: number;
}

export function StartupHero({ startup, totalLots }: StartupHeroProps) {
  if (!startup) {
    return (
      <div className="rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[380px] bg-[#f9f8f6] border border-[#e2e5ea] shadow-sm">
        <span className="text-xs font-medium uppercase tracking-widest text-[#6b7a8d] mb-2">
          Lobby Stage
        </span>
        <h3 className="text-lg font-semibold text-[#33404f]">
          Awaiting Next Lot Presentation
        </h3>
        <p className="text-xs text-[#6b7a8d] max-w-sm mt-1.5 leading-relaxed">
          The stage operator will assign the next presenting startup for live bidding shortly.
        </p>
      </div>
    );
  }

  const getStatusIndicator = () => {
    switch (startup.status) {
      case 'ACTIVE_BIDDING':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Live Bidding Active
          </span>
        );
      case 'PRESENTING':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Pitch in Progress
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            Bidding Paused
          </span>
        );
      case 'SOLD':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a5c3e] bg-[#1a5c3e]/10 px-2.5 py-0.5 rounded-md border border-[#1a5c3e]/20">
            Round Won (Sold)
          </span>
        );
      case 'UNSOLD':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-800 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
            Round Passed
          </span>
        );
      default:
        return (
          <span className="text-xs text-[#6b7a8d] font-medium">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl p-6 sm:p-8 bg-[#f9f8f6] border border-[#e2e5ea] shadow-sm flex flex-col justify-between h-full transition-colors duration-150">
      <div className="space-y-6">
        {/* Subtle Top Metadata Line */}
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-[#6b7a8d]">
            <span className="font-mono font-medium tracking-tight">
              Lot {startup.display_order} of {totalLots}
            </span>
            <span>·</span>
            <span className="font-semibold text-[#1a5c3e]">
              {startup.sector}
            </span>
          </div>
          <div>{getStatusIndicator()}</div>
        </div>

        {/* Startup Headline & Tagline */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#33404f] tracking-tight text-balance">
            {startup.name}
          </h2>
          {startup.tagline && (
            <p className="text-sm sm:text-base text-[#6b7a8d] mt-1.5 leading-snug">
              {startup.tagline}
            </p>
          )}
        </div>

        {/* Founders */}
        {startup.founder_names && startup.founder_names.length > 0 && (
          <div className="text-xs text-[#6b7a8d]">
            <span className="text-[#6b7a8d] mr-1.5">Founders:</span>
            <span className="text-[#33404f] font-medium">
              {startup.founder_names.join(', ')}
            </span>
          </div>
        )}

        {/* Description */}
        {startup.description && (
          <p className="text-xs sm:text-sm text-[#6b7a8d] leading-relaxed text-pretty">
            {startup.description}
          </p>
        )}
      </div>

      {/* Opening Valuation Floor */}
      <div className="mt-8 pt-5 border-t border-[#e2e5ea] flex items-baseline justify-between">
        <div>
          <span className="text-xs text-[#6b7a8d] block font-medium">
            Base Floor Price
          </span>
          <span className="text-[11px] text-[#6b7a8d]">
            Minimum reserve
          </span>
        </div>
        <div className="text-right">
          <span className="text-base sm:text-lg font-semibold text-[#33404f] font-mono tabular-nums">
            ₹{Number(startup.base_price).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
