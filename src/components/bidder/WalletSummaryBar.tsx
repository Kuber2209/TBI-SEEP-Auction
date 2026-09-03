'use client';

import React from 'react';
import { BidderWallet } from '@/lib/supabase/types';
import { Wallet, Lock, CheckCircle, PieChart, ChevronRight, Gauge } from 'lucide-react';

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
    <div className="glass-panel border-t border-white/[0.07] px-4 sm:px-6 lg:px-8 py-3.5 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
          {/* Available Balance */}
          <div
            onClick={handleOpen}
            className={`flex items-center gap-3 bg-navy-900 rounded-[16px] p-3 sm:p-3.5 border border-white/[0.07] shadow-sm ${
              handleOpen ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-navy-850 transition-colors duration-150' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Wallet className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block">
                Available Purse
              </span>
              <span className="font-semibold text-base sm:text-xl text-white tracking-tight tabular-nums">
                ₹ {available.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Locked in Escrow */}
          <div
            onClick={handleOpen}
            className={`flex items-center gap-3 bg-navy-900 rounded-[16px] p-3 sm:p-3.5 border border-white/[0.07] shadow-sm ${
              handleOpen ? 'cursor-pointer hover:border-amber-500/40 hover:bg-navy-850 transition-colors duration-150' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-[10px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-amber-400 block">
                In Active Escrow
              </span>
              <span className="font-semibold text-base sm:text-xl text-white tracking-tight tabular-nums">
                ₹ {locked.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Total Invested */}
          <div
            onClick={handleOpen}
            className={`flex items-center gap-3 bg-navy-900 rounded-[16px] p-3 sm:p-3.5 border border-white/[0.07] shadow-sm ${
              handleOpen ? 'cursor-pointer hover:border-blue-400/40 hover:bg-navy-850 transition-colors duration-150' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-[10px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-blue-400 block">
                Total Deployed
              </span>
              <span className="font-semibold text-base sm:text-xl text-white tracking-tight tabular-nums">
                ₹ {spent.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Starting Purse & Drawer Trigger */}
          <div
            onClick={handleOpen}
            className={`flex items-center justify-between gap-2 bg-navy-900/50 rounded-[16px] p-3 sm:p-3.5 border border-white/[0.07] shadow-sm ${
              handleOpen ? 'cursor-pointer hover:border-gold-500/30 hover:bg-navy-850 transition-colors duration-150 group' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-navy-800 group-hover:bg-gold-500/10 border border-white/[0.04] group-hover:border-gold-500/20 group-hover:text-gold-400 flex items-center justify-center text-slate-400 shrink-0 transition-colors duration-150">
                <PieChart className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Starting Allocation
                </span>
                <span className="font-semibold text-base sm:text-xl text-slate-300 tracking-tight tabular-nums">
                  ₹ {initial.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {handleOpen && (
              <span className="hidden xl:flex items-center gap-1 text-[10px] font-semibold text-gold-400 group-hover:text-gold-300 bg-navy-950 px-2 py-1 rounded-[6px] border border-white/[0.07] shrink-0">
                <span>Telemetry</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150" strokeWidth={2} />
              </span>
            )}
          </div>
        </div>

        {/* Capital Deployment Progress Bar (Clickable to open drawer) */}
        <div
          onClick={handleOpen}
          className={`hidden sm:block ${handleOpen ? 'cursor-pointer group' : ''}`}
          title="Click to view full Capital Efficiency Drawer"
        >
          <div className="h-2 w-full bg-navy-950 rounded-full overflow-hidden flex border border-white/[0.07] group-hover:border-gold-500/30 transition-colors duration-150">
            <div
              style={{ width: `${spentPct}%` }}
              title={`Spent: ${spentPct.toFixed(1)}%`}
              className="bg-blue-400 transition-all duration-300"
            />
            <div
              style={{ width: `${lockedPct}%` }}
              title={`In Escrow: ${lockedPct.toFixed(1)}%`}
              className="bg-amber-400 transition-all duration-300"
            />
            <div
              style={{ width: `${availablePct}%` }}
              title={`Available: ${availablePct.toFixed(1)}%`}
              className="bg-emerald-500 transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
