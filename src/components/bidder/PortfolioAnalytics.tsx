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
    <div className="rounded-xl p-5 sm:p-6 bg-[#f9f8f6] border border-[#e2e5ea] space-y-5 shadow-sm transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#e2e5ea]">
        <div>
          <h3 className="text-sm font-semibold text-[#33404f]">
            Portfolio Telemetry
          </h3>
          <p className="text-xs text-[#6b7a8d]">
            Capital deployment & diversification
          </p>
        </div>

        {handleOpen && (
          <button
            onClick={handleOpen}
            className="text-xs font-semibold text-[#1a5c3e] hover:text-[#154c33] flex items-center gap-1 transition-colors"
          >
            <span>Full Drawer</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-[#6b7a8d] block font-medium">Avg Lot Cost</span>
          <span className="text-sm sm:text-base font-semibold text-[#33404f] font-mono tabular-nums mt-0.5 block">
            ₹{avgAcquisitionCost.toLocaleString('en-IN')}
          </span>
        </div>

        <div>
          <span className="text-[#6b7a8d] block font-medium">Deployment</span>
          <span className="text-sm sm:text-base font-semibold text-[#33404f] font-mono tabular-nums mt-0.5 block">
            {portfolioBurnRate.toFixed(0)}%
          </span>
        </div>

        <div>
          <span className="text-[#6b7a8d] block font-medium">Lots Won</span>
          <span className="text-sm sm:text-base font-semibold text-[#1a5c3e] font-mono tabular-nums mt-0.5 block">
            {wonCount}
          </span>
        </div>
      </div>

      {/* Sector Allocation Breakdown */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-[#6b7a8d] mb-2">
          <span className="font-medium text-[#33404f]">Sector Allocation</span>
          <span>{wonCount} won</span>
        </div>

        {wonCount === 0 ? (
          <p className="text-xs text-[#6b7a8d] italic py-2">
            No startups won yet. Allocations will calculate as lots settle.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(sectorCounts).map(([sector, data]) => {
              const pct = spent > 0 ? ((data.spent / spent) * 100).toFixed(0) : '0';
              return (
                <span
                  key={sector}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f1f4f7] border border-[#e2e5ea] text-[#33404f] text-xs font-medium"
                >
                  <span>{sector}</span>
                  <span className="text-[#6b7a8d] font-mono">
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
