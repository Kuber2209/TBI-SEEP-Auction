'use client';

import React from 'react';
import { Startup, BidderWallet } from '@/lib/supabase/types';
import {
  PieChart,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Sprout,
  Coins,
  Rocket,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
  Flame,
} from 'lucide-react';

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

  // Calculate sector distribution across 5 core pillars
  const sectorCounts: Record<string, { count: number; spent: number }> = {};
  wonStartups.forEach((s) => {
    const sec = s.sector || 'DeepTech';
    if (!sectorCounts[sec]) {
      sectorCounts[sec] = { count: 0, spent: 0 };
    }
    sectorCounts[sec].count += 1;
    sectorCounts[sec].spent += Number(s.winning_bid_amount || 0);
  });

  const getSectorStyle = (sector: string) => {
    const s = sector.toLowerCase();
    if (s.includes('clean') || s.includes('ev')) {
      return { dot: 'bg-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-300', badge: 'bg-emerald-500/15 border-emerald-500/30' };
    }
    if (s.includes('med') || s.includes('health') || s.includes('bio')) {
      return { dot: 'bg-rose-500', bar: 'bg-rose-500', text: 'text-rose-300', badge: 'bg-rose-500/15 border-rose-500/30' };
    }
    if (s.includes('agri')) {
      return { dot: 'bg-lime-500', bar: 'bg-lime-500', text: 'text-lime-300', badge: 'bg-lime-500/15 border-lime-500/30' };
    }
    if (s.includes('fin') || s.includes('web3')) {
      return { dot: 'bg-gold-500', bar: 'bg-gold-500', text: 'text-gold-300', badge: 'bg-gold-500/15 border-gold-500/30' };
    }
    if (s.includes('deep') || s.includes('aero') || s.includes('space')) {
      return { dot: 'bg-cyan-500', bar: 'bg-cyan-500', text: 'text-cyan-300', badge: 'bg-cyan-500/15 border-cyan-500/30' };
    }
    if (s.includes('robot') || s.includes('ai')) {
      return { dot: 'bg-purple-500', bar: 'bg-purple-500', text: 'text-purple-300', badge: 'bg-purple-500/15 border-purple-500/30' };
    }
    return { dot: 'bg-blue-500', bar: 'bg-blue-500', text: 'text-blue-300', badge: 'bg-blue-500/15 border-blue-500/30' };
  };

  return (
    <div className="glass-card rounded-[24px] p-6 border border-white/[0.07] shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[12px] bg-seep-sky/15 border border-seep-sky/30 flex items-center justify-center text-seep-sky shrink-0">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
              Investor Intelligence & Analytics
            </h3>
            <p className="text-[10px] text-slate-400">Capital deployment & portfolio telemetry</p>
          </div>
        </div>

        {handleOpen && (
          <button
            onClick={handleOpen}
            className="flex items-center gap-1.5 px-3 py-1 rounded-[12px] bg-navy-900 hover:bg-navy-850 text-xs font-bold text-gold-400 hover:text-gold-300 border border-white/[0.07] hover:border-gold-500/40 transition shadow-sm"
          >
            <span>Open Drawer</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[16px] bg-navy-950/80 border border-white/[0.07] shadow-inner">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">
            Avg Lot Cost
          </span>
          <span className="font-semibold text-base sm:text-lg text-white mt-0.5 block">
            ₹ {avgAcquisitionCost.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-3.5 rounded-[16px] bg-navy-950/80 border border-white/[0.07] shadow-inner">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">
            Purse Deployment
          </span>
          <span className="font-semibold text-base sm:text-lg text-seep-sky mt-0.5 block">
            {portfolioBurnRate.toFixed(1)}% Deployed
          </span>
        </div>

        <div className="p-3.5 rounded-[16px] bg-navy-950/80 border border-white/[0.07] shadow-inner col-span-2 sm:col-span-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">
            Remaining Runway
          </span>
          <span className="font-semibold text-base sm:text-lg text-emerald-400 mt-0.5 block">
            ₹ {available.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Sector Diversification */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Portfolio Sector Diversification
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {wonCount} Lots Acquired
          </span>
        </div>

        {wonCount === 0 ? (
          <div className="p-4 rounded-[12px] bg-navy-950/40 border border-white/[0.07] text-center text-slate-500 text-xs italic">
            Sector distribution breakdown will appear here once lots are won.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(sectorCounts).map(([sector, data]) => {
                const style = getSectorStyle(sector);
                const pct = spent > 0 ? ((data.spent / spent) * 100).toFixed(0) : '0';
                return (
                  <div
                    key={sector}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-[12px] bg-navy-950 border text-xs ${style.badge}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <span className="font-semibold text-slate-200">{sector}:</span>
                    <strong className="text-white font-mono">{data.count}</strong>
                    <span className="text-[10px] text-slate-400">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deep-Dive Drawer Trigger Action */}
      {handleOpen && (
        <button
          onClick={handleOpen}
          className="w-full py-2.5 px-4 rounded-[16px] bg-gradient-to-r from-navy-900 to-navy-850 hover:from-navy-850 hover:to-navy-800 border border-navy-700 hover:border-gold-500/50 text-xs font-bold text-gold-300 flex items-center justify-center gap-2 transition active:scale-98 shadow-sm group"
        >
          <span>View Deep-Tier Capital Efficiency & Risk Command</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
        </button>
      )}
    </div>
  );
}
