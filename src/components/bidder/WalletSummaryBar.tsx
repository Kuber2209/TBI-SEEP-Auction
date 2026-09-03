'use client';

import React from 'react';
import { BidderWallet } from '@/lib/supabase/types';
import { ArrowRight } from 'lucide-react';

interface WalletSummaryBarProps {
  wallet: BidderWallet | null;
  onOpenDrawer?: () => void;
  onOpenPortfolio?: () => void;
}

export function WalletSummaryBar({
  wallet,
  onOpenDrawer,
  onOpenPortfolio,
}: WalletSummaryBarProps) {
  const initial = Number(wallet?.initial_balance || 50000);
  const available = Number(wallet?.available_balance || 0);
  const locked = Number(wallet?.locked_balance || 0);
  const spent = Number(wallet?.total_spent || 0);

  const availablePct = Math.min(100, Math.max(0, (available / (initial || 1)) * 100));
  const lockedPct = Math.min(100, Math.max(0, (locked / (initial || 1)) * 100));
  const spentPct = Math.min(100, Math.max(0, (spent / (initial || 1)) * 100));

  const handleOpen = onOpenDrawer || onOpenPortfolio;

  return (
    <div className="bg-white/95 dark:bg-[#0D121D]/95 backdrop-blur border-t border-slate-200/80 dark:border-white/[0.06] px-4 sm:px-6 lg:px-8 py-2.5 transition-colors duration-150">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Integrated Financial Bar (Un-boxed, separated by subtle dividers) */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* 1. Primary Number: Available Purse */}
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Available</span>
              <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tabular-nums">
                ₹{available.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-white/[0.08]" />

            {/* 2. Secondary: In Active Escrow */}
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 dark:text-slate-500 font-medium">In Escrow</span>
              <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300 tabular-nums">
                ₹{locked.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-white/[0.08]" />

            {/* 3. Tertiary: Total Deployed */}
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Deployed</span>
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                ₹{spent.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-white/[0.08]" />

            {/* 4. Total Initial Purse */}
            <div className="hidden md:flex items-baseline gap-2 text-slate-400 dark:text-slate-500">
              <span>Total Purse:</span>
              <span className="font-mono tabular-nums">₹{initial.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Trigger to view detailed portfolio analytics */}
          {handleOpen && (
            <button
              onClick={handleOpen}
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Portfolio Allocation</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Slim Linear Deployment Indicator (1.5px high, calm and quiet) */}
        <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${spentPct}%` }}
            title={`Deployed: ${spentPct.toFixed(1)}%`}
            className="bg-slate-400 dark:bg-slate-500 transition-all duration-300"
          />
          <div
            style={{ width: `${lockedPct}%` }}
            title={`In Escrow: ${lockedPct.toFixed(1)}%`}
            className="bg-amber-500 transition-all duration-300"
          />
          <div
            style={{ width: `${availablePct}%` }}
            title={`Available: ${availablePct.toFixed(1)}%`}
            className="bg-emerald-500 transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );
}
