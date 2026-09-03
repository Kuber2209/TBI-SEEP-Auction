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
    <div className="bg-[#f9f8f6] border-t border-[#e2e5ea] px-4 sm:px-6 lg:px-8 py-2.5 transition-colors duration-150 shadow-[0_-1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Integrated Financial Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* 1. Primary Number: Available Purse */}
            <div className="flex items-baseline gap-2">
              <span className="text-[#6b7a8d] font-medium">Available</span>
              <span className="text-sm sm:text-base font-semibold text-[#1a5c3e] font-mono tabular-nums">
                ₹{available.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-[#e2e5ea]" />

            {/* 2. Secondary: In Active Escrow */}
            <div className="flex items-baseline gap-2">
              <span className="text-[#6b7a8d] font-medium">In Escrow</span>
              <span className="text-xs sm:text-sm font-semibold text-amber-800 font-mono tabular-nums">
                ₹{locked.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-[#e2e5ea]" />

            {/* 3. Tertiary: Total Deployed */}
            <div className="flex items-baseline gap-2">
              <span className="text-[#6b7a8d] font-medium">Deployed</span>
              <span className="text-xs sm:text-sm font-semibold text-[#33404f] font-mono tabular-nums">
                ₹{spent.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-[#e2e5ea]" />

            {/* 4. Total Initial Purse */}
            <div className="hidden md:flex items-baseline gap-2 text-[#6b7a8d]">
              <span>Total Purse:</span>
              <span className="font-mono tabular-nums text-[#33404f] font-semibold">₹{initial.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Trigger to view detailed portfolio analytics */}
          {handleOpen && (
            <button
              onClick={handleOpen}
              className="text-xs font-semibold text-[#1a5c3e] hover:text-[#154c33] flex items-center gap-1 transition-colors"
            >
              <span>Portfolio Allocation</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Slim Linear Deployment Indicator */}
        <div className="h-1.5 w-full bg-[#e2e5ea] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${spentPct}%` }}
            title={`Deployed: ${spentPct.toFixed(1)}%`}
            className="bg-[#6b7a8d] transition-all duration-300"
          />
          <div
            style={{ width: `${lockedPct}%` }}
            title={`In Escrow: ${lockedPct.toFixed(1)}%`}
            className="bg-amber-500 transition-all duration-300"
          />
          <div
            style={{ width: `${availablePct}%` }}
            title={`Available: ${availablePct.toFixed(1)}%`}
            className="bg-[#1a5c3e] transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );
}
