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
      <div className="rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[380px] bg-white dark:bg-[#0F131D] border border-slate-200/80 dark:border-white/[0.06]">
        <span className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
          Lobby Stage
        </span>
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
          Awaiting Next Lot Presentation
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          The stage operator will assign the next presenting startup for live bidding shortly.
        </p>
      </div>
    );
  }

  const getStatusIndicator = () => {
    switch (startup.status) {
      case 'ACTIVE_BIDDING':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Bidding Active
          </span>
        );
      case 'PRESENTING':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Pitch in Progress
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Bidding Paused
          </span>
        );
      case 'SOLD':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            Round Won (Sold)
          </span>
        );
      case 'UNSOLD':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            Round Passed
          </span>
        );
      default:
        return (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl p-6 sm:p-8 bg-white dark:bg-[#0F131D] border border-slate-200/80 dark:border-white/[0.06] flex flex-col justify-between h-full transition-colors duration-150">
      <div className="space-y-6">
        {/* Subtle Top Metadata Line (no boxes or nested pills) */}
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="font-mono font-medium tracking-tight">
              Lot {startup.display_order} of {totalLots}
            </span>
            <span>·</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {startup.sector}
            </span>
          </div>
          <div>{getStatusIndicator()}</div>
        </div>

        {/* Startup Headline & Tagline */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight text-balance">
            {startup.name}
          </h2>
          {startup.tagline && (
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1.5 leading-snug">
              {startup.tagline}
            </p>
          )}
        </div>

        {/* Founders (Natural inline typography, no nested boxes) */}
        {startup.founder_names && startup.founder_names.length > 0 && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="text-slate-400 dark:text-slate-500 mr-1.5">Founders:</span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">
              {startup.founder_names.join(', ')}
            </span>
          </div>
        )}

        {/* Description (Clean editorial typography with breathing room) */}
        {startup.description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-pretty">
            {startup.description}
          </p>
        )}
      </div>

      {/* Opening Valuation Floor (Quiet, secondary, integrated baseline) */}
      <div className="mt-8 pt-5 border-t border-slate-100 dark:border-white/[0.06] flex items-baseline justify-between">
        <div>
          <span className="text-xs text-slate-400 dark:text-slate-500 block">
            Base Floor Price
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Minimum reserve
          </span>
        </div>
        <div className="text-right">
          <span className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 tabular-nums">
            ₹{Number(startup.base_price).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
