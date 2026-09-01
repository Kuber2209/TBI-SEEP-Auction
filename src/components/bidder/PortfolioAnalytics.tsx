'use client';

import React from 'react';
import { Startup, BidderWallet } from '@/lib/supabase/types';
import { PieChart, TrendingUp, ShieldCheck, Zap, Activity, Sprout, Coins, Rocket, Cpu, Layers } from 'lucide-react';

interface PortfolioAnalyticsProps {
  wonStartups: Startup[];
  wallet: BidderWallet | null;
}

export function PortfolioAnalytics({ wonStartups, wallet }: PortfolioAnalyticsProps) {
  const initial = Number(wallet?.initial_balance || 50000);
  const spent = Number(wallet?.total_spent || 0);
  const available = Number(wallet?.available_balance || 0);
  const wonCount = wonStartups.length;

  const avgAcquisitionCost = wonCount > 0 ? Math.round(spent / wonCount) : 0;
  const portfolioBurnRate = Math.round((spent / (initial || 1)) * 100);

  // Calculate sector distribution
  const sectorCounts: Record<string, number> = {};
  wonStartups.forEach((s) => {
    sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1;
  });

  const getSectorColor = (sector: string) => {
    const s = sector.toLowerCase();
    if (s.includes('clean') || s.includes('ev')) return 'bg-emerald-500 text-emerald-300 border-emerald-500/40';
    if (s.includes('med') || s.includes('health') || s.includes('bio')) return 'bg-rose-500 text-rose-300 border-rose-500/40';
    if (s.includes('agri')) return 'bg-lime-500 text-lime-300 border-lime-500/40';
    if (s.includes('fin') || s.includes('web3')) return 'bg-gold-500 text-gold-300 border-gold-500/40';
    if (s.includes('deep') || s.includes('aero') || s.includes('space')) return 'bg-cyan-500 text-cyan-300 border-cyan-500/40';
    if (s.includes('robot') || s.includes('ai')) return 'bg-purple-500 text-purple-300 border-purple-500/40';
    return 'bg-blue-500 text-blue-300 border-blue-500/40';
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-navy-800/80 shadow-2xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-navy-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-seep-sky/15 border border-seep-sky/30 flex items-center justify-center text-seep-sky">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
              Investor Intelligence & Analytics
            </h3>
            <p className="text-[10px] text-slate-400">Capital deployment & portfolio telemetry</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-slate-300 bg-navy-900 px-2.5 py-1 rounded-lg border border-navy-800">
          {wonCount} Lots Acquired
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-navy-950/80 border border-navy-800 shadow-inner">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">
            Avg Lot Cost
          </span>
          <span className="font-display font-black text-base sm:text-lg text-white mt-0.5 block">
            ₹ {avgAcquisitionCost.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-navy-950/80 border border-navy-800 shadow-inner">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">
            Purse Deployment
          </span>
          <span className="font-display font-black text-base sm:text-lg text-seep-sky mt-0.5 block">
            {portfolioBurnRate}% Deployed
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-navy-950/80 border border-navy-800 shadow-inner col-span-2 sm:col-span-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">
            Remaining Runway
          </span>
          <span className="font-display font-black text-base sm:text-lg text-emerald-400 mt-0.5 block">
            ₹ {available.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Sector Diversification */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
          Portfolio Sector Diversification
        </span>

        {wonCount === 0 ? (
          <div className="p-4 rounded-xl bg-navy-950/40 border border-navy-800 text-center text-slate-500 text-xs italic">
            Sector distribution breakdown will appear here once lots are won.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(sectorCounts).map(([sector, count]) => (
              <div
                key={sector}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-navy-950 border border-navy-800 text-xs"
              >
                <span className={`w-2 h-2 rounded-full ${getSectorColor(sector).split(' ')[0]}`} />
                <span className="font-semibold text-slate-200">{sector}:</span>
                <strong className="text-white font-mono">{count}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
