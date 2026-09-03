'use client';

import React from 'react';
import { Startup, BidderWallet } from '@/lib/supabase/types';
import { ArrowRight } from 'lucide-react';

interface PortfolioAnalyticsProps {
  wonStartups: Startup[];
  wallet: BidderWallet | null;
  onOpenDrawer?: () => void;
  onOpenPortfolio?: () => void;
}

export function PortfolioAnalytics({
  wonStartups,
  wallet,
  onOpenDrawer,
  onOpenPortfolio,
}: PortfolioAnalyticsProps) {
  const initial = Number(wallet?.initial_balance || 50000);
  const spent = Number(wallet?.total_spent || 0);
  const available = Number(wallet?.available_balance || 0);
  const wonCount = wonStartups.length;

  const avgAcquisitionCost = wonCount > 0 ? Math.round(spent / wonCount) : 0;
  const portfolioBurnRate = Math.min(100, Math.max(0, (spent / (initial || 1)) * 100));

  const handleOpen = onOpenDrawer || onOpenPortfolio;

  // Calculate sector distribution
  const sectorCounts: Record<string, { count: number; spent: number }> = {};
  wonStartups.forEach((s) => {
    const sec = s.sector || 'DeepTech';
    if (!sectorCounts[sec]) {
      sectorCounts[sec] = { count: 0, spent: 0 };
    }
    sectorCounts[sec].count += 1;
    sectorCounts[sec].spent += Number(s.winning_bid_amount || 0);
  });

  return (
    <div className="rounded-xl p-5 sm:p-6 bg-white dark:bg-[#0F131D] border border-slate-200/80 dark:border-white/[0.06] space-y-5 transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Portfolio Telemetry
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Capital deployment & diversification
          </p>
        </div>

        {handleOpen && (
          <button
            onClick={handleOpen}
            className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Full Drawer</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Metrics Row (Integrated and un-boxed) */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-slate-400 dark:text-slate-500 block">Avg Lot Cost</span>
          <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
            ₹{avgAcquisitionCost.toLocaleString('en-IN')}
          </span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-500 block">Deployment</span>
          <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 tabular-nums mt-0.5 block">
            {portfolioBurnRate.toFixed(0)}%
          </span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-500 block">Lots Won</span>
          <span className="text-sm sm:text-base font-semibold text-amber-700 dark:text-amber-400 tabular-nums mt-0.5 block">
            {wonCount}
          </span>
        </div>
      </div>

      {/* Sector Allocation Breakdown */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span>Sector Allocation</span>
          <span>{wonCount} won</span>
        </div>

        {wonCount === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
            No startups won yet. Allocations will calculate as lots settle.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(sectorCounts).map(([sector, data]) => {
              const pct = spent > 0 ? ((data.spent / spent) * 100).toFixed(0) : '0';
              return (
                <span
                  key={sector}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 text-xs font-medium"
                >
                  <span>{sector}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">
                    ({data.count} · {pct}%)
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
