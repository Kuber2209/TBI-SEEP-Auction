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
    <div className="bg-[#eff4f0] border-t border-[#cad7cc] px-4 sm:px-6 lg:px-8 py-2.5 transition-colors duration-150 shadow-[0_-1px_3px_rgba(32,49,38,0.05)]">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Integrated Financial Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* 1. Primary Number: Available Purse */}
            <div className="flex items-baseline gap-2">
              <span className="text-[#56695e] font-medium">Available</span>
              <span className="text-sm sm:text-base font-semibold text-[#1a5c3e] font-mono tabular-nums">
                ₹{available.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-[#cad7cc]" />

            {/* 2. Secondary: In Active Escrow */}
            <div className="flex items-baseline gap-2">
              <span className="text-[#56695e] font-medium">In Escrow</span>
              <span className="text-xs sm:text-sm font-semibold text-amber-800 font-mono tabular-nums">
                ₹{locked.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-[#cad7cc]" />

            {/* 3. Tertiary: Total Deployed */}
            <div className="flex items-baseline gap-2">
              <span className="text-[#56695e] font-medium">Deployed</span>
              <span className="text-xs sm:text-sm font-semibold text-[#203126] font-mono tabular-nums">
                ₹{spent.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-[#cad7cc]" />

            {/* 4. Total Initial Purse */}
            <div className="hidden md:flex items-baseline gap-2 text-[#56695e]">
              <span>Total Purse:</span>
              <span className="font-mono tabular-nums text-[#203126] font-semibold">₹{initial.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Trigger to view detailed portfolio analytics */}
          {handleOpen && (
            <button
              onClick={handleOpen}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] border border-[#cad7cc] text-xs font-semibold text-[#203126] transition active:scale-[0.98]"
            >
              <span>Portfolio & Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#1a5c3e]" />
            </button>
          )}
        </div>

        {/* Linear Deployment Track */}
        <div className="w-full bg-[#cad7cc] h-1.5 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${spentPct}%` }}
            className="bg-[#203126] h-full transition-all duration-300"
            title={`Deployed: ${spentPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${lockedPct}%` }}
            className="bg-amber-500 h-full transition-all duration-300"
            title={`Locked in Escrow: ${lockedPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${availablePct}%` }}
            className="bg-[#1a5c3e] h-full transition-all duration-300"
            title={`Available: ${availablePct.toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
}
