'use client';

import React, { useEffect, useMemo } from 'react';
import { Startup, BidderWallet } from '@/lib/supabase/types';
import {
  X,
  Briefcase,
  PieChart,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  Sprout,
  Coins,
  Cpu,
  Bot,
  Layers,
  Flame,
  Lock,
  Wallet,
  CheckCircle,
  Sparkles,
  Info,
  Building2,
  DollarSign,
  Gauge,
} from 'lucide-react';

export interface PortfolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wonStartups: Startup[];
  wallet: BidderWallet | null;
  teamName: string;
  totalLots?: number;
}

interface SectorMeta {
  name: string;
  color: string;
  barColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PortfolioDrawer({
  isOpen,
  onClose,
  wonStartups = [],
  wallet,
  teamName,
  totalLots = 12,
}: PortfolioDrawerProps) {
  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Core Financial Metrics
  const initial = Number(wallet?.initial_balance || 50000);
  const spent = Number(wallet?.total_spent || 0);
  const locked = Number(wallet?.locked_balance || 0);
  const available = Number(wallet?.available_balance || 0);
  const wonCount = wonStartups.length;

  const avgAcquisitionCost = wonCount > 0 ? Math.round(spent / wonCount) : 0;
  const burnRatePct = Math.min(100, Math.max(0, (spent / (initial || 1)) * 100));
  const escrowExposurePct = Math.min(100, Math.max(0, (locked / (initial || 1)) * 100));
  const availablePct = Math.min(100, Math.max(0, (available / (initial || 1)) * 100));

  // Map 5 Key Sectors
  const getSectorMeta = (sectorStr: string): SectorMeta => {
    const s = (sectorStr || '').toLowerCase();
    if (s.includes('clean') || s.includes('ev') || s.includes('energy') || s.includes('solar')) {
      return {
        name: 'CleanTech',
        color: 'text-emerald-800',
        barColor: 'bg-emerald-600',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-800',
        badgeBorder: 'border-emerald-200',
        icon: Zap,
      };
    }
    if (s.includes('med') || s.includes('health') || s.includes('bio') || s.includes('pharma')) {
      return {
        name: 'MedTech',
        color: 'text-rose-800',
        barColor: 'bg-rose-600',
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-800',
        badgeBorder: 'border-rose-200',
        icon: Activity,
      };
    }
    if (s.includes('agri') || s.includes('farm') || s.includes('food') || s.includes('crop')) {
      return {
        name: 'AgriTech',
        color: 'text-lime-800',
        barColor: 'bg-lime-600',
        badgeBg: 'bg-lime-50',
        badgeText: 'text-lime-800',
        badgeBorder: 'border-lime-200',
        icon: Sprout,
      };
    }
    if (s.includes('fin') || s.includes('pay') || s.includes('bank') || s.includes('web3') || s.includes('crypto')) {
      return {
        name: 'FinTech',
        color: 'text-amber-800',
        barColor: 'bg-amber-600',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-200',
        icon: Coins,
      };
    }
    if (s.includes('robot') || s.includes('ai') || s.includes('ml')) {
      return {
        name: 'AI / Robotics',
        color: 'text-[#1a5c3e]',
        barColor: 'bg-[#1a5c3e]',
        badgeBg: 'bg-[#1a5c3e]/10',
        badgeText: 'text-[#1a5c3e]',
        badgeBorder: 'border-[#1a5c3e]/20',
        icon: Bot,
      };
    }
    // DeepTech fallback
    return {
      name: 'DeepTech',
      color: 'text-[#1a5c3e]',
      barColor: 'bg-[#1a5c3e]',
      badgeBg: 'bg-[#1a5c3e]/10',
      badgeText: 'text-[#1a5c3e]',
      badgeBorder: 'border-[#1a5c3e]/20',
      icon: Cpu,
    };
  };

  // Sector breakdown calculations
  const sectorBreakdown = useMemo(() => {
    const sectors: Record<string, { name: string; amount: number; count: number; meta: SectorMeta }> = {
      CleanTech: { name: 'CleanTech', amount: 0, count: 0, meta: getSectorMeta('cleantech') },
      MedTech: { name: 'MedTech', amount: 0, count: 0, meta: getSectorMeta('medtech') },
      AgriTech: { name: 'AgriTech', amount: 0, count: 0, meta: getSectorMeta('agritech') },
      FinTech: { name: 'FinTech', amount: 0, count: 0, meta: getSectorMeta('fintech') },
      DeepTech: { name: 'DeepTech', amount: 0, count: 0, meta: getSectorMeta('deeptech') },
    };

    wonStartups.forEach((startup) => {
      const meta = getSectorMeta(startup.sector);
      const standardName = meta.name.includes('AI') ? 'DeepTech' : meta.name;
      const key = sectors[standardName] ? standardName : 'DeepTech';

      const winAmount = Number(startup.winning_bid_amount || 0);
      sectors[key].amount += winAmount;
      sectors[key].count += 1;
    });

    return Object.values(sectors).map((sec) => ({
      ...sec,
      percentage: spent > 0 ? (sec.amount / spent) * 100 : 0,
    }));
  }, [wonStartups, spent]);

  // 4 Capital Allocation Risk Indicators
  const riskAnalysis = useMemo(() => {
    // 1. Sector Overconcentration Risk (>40% capital in single sector)
    const maxSectorPct = Math.max(0, ...sectorBreakdown.map((s) => s.percentage));
    const highestSector = sectorBreakdown.find((s) => s.percentage === maxSectorPct);
    const isOverconcentrated = spent > 0 && maxSectorPct > 40 && wonCount > 0;

    // 2. Rapid Depletion Velocity (>60% purse spent early)
    const isRapidDepletion = burnRatePct > 60 && wonCount < Math.ceil(totalLots / 2);

    // 3. Active Escrow Exposure (>50% purse locked in active bids)
    const isHighEscrowExposure = escrowExposurePct > 50;

    // 4. Low Runway Buffer (available balance < ₹10,000)
    const isLowRunway = available < 10000;

    return {
      overconcentration: {
        triggered: isOverconcentrated,
        value: maxSectorPct,
        sectorName: highestSector?.name || 'None',
        severity: isOverconcentrated ? 'high' : 'safe',
        title: 'Sector Overconcentration Risk',
        description: isOverconcentrated
          ? `${highestSector?.name} holds ${maxSectorPct.toFixed(1)}% of invested capital (>40% threshold). Consider diversifying upcoming lots.`
          : `Portfolio sector spread is well-balanced (highest sector at ${maxSectorPct.toFixed(1)}%).`,
      },
      depletionVelocity: {
        triggered: isRapidDepletion,
        value: burnRatePct,
        severity: isRapidDepletion ? 'warning' : 'safe',
        title: 'Rapid Depletion Velocity',
        description: isRapidDepletion
          ? `${burnRatePct.toFixed(1)}% purse consumed across only ${wonCount} lot(s). Capital pacing is aggressive.`
          : `Burn velocity is on-target (${burnRatePct.toFixed(1)}% deployed across ${wonCount} acquisitions).`,
      },
      escrowExposure: {
        triggered: isHighEscrowExposure,
        value: escrowExposurePct,
        severity: isHighEscrowExposure ? 'warning' : 'safe',
        title: 'Active Escrow Exposure',
        description: isHighEscrowExposure
          ? `${escrowExposurePct.toFixed(1)}% (₹${locked.toLocaleString('en-IN')}) of total purse is currently held in active bids.`
          : `Escrow hold is healthy (${escrowExposurePct.toFixed(1)}% locked in active lots).`,
      },
      runwayBuffer: {
        triggered: isLowRunway,
        value: available,
        severity: isLowRunway ? 'critical' : 'safe',
        title: 'Low Runway Buffer',
        description: isLowRunway
          ? `Remaining liquid purse is ₹${available.toLocaleString('en-IN')} (< ₹10,000 minimum safety buffer). High risk of bid lockout.`
          : `Liquid runway buffer is strong (₹${available.toLocaleString('en-IN')} liquid cash available).`,
      },
    };
  }, [sectorBreakdown, spent, wonCount, totalLots, burnRatePct, escrowExposurePct, locked, available]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden animate-fade-in"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Panel Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-[#f9f8f6] border-l border-[#e2e5ea] shadow-xl flex flex-col justify-between overflow-hidden text-[#33404f]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e2e5ea] bg-[#f9f8f6] flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 flex items-center justify-center text-[#1a5c3e] font-bold shrink-0">
                <Briefcase className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <h2
                  id="portfolio-drawer-title"
                  className="text-base sm:text-lg font-semibold text-[#33404f] flex items-center gap-2"
                >
                  <span>{teamName}&rsquo;s Capital Intelligence</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#1a5c3e]/10 text-[#1a5c3e] text-xs font-mono font-bold border border-[#1a5c3e]/20">
                    {wonCount} Won
                  </span>
                </h2>
                <p className="text-xs text-[#6b7a8d]">
                  Slide-over portfolio analytics, capital efficiency & risk command
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close portfolio drawer"
              className="p-2.5 rounded-md bg-[#f1f4f7] hover:bg-[#e2e5ea] text-[#6b7a8d] hover:text-[#33404f] border border-[#e2e5ea] transition active:scale-[0.98] shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Live Purse Burn-Rate Gauge & Core Financials */}
            <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#1a5c3e]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#33404f]">
                    Live Purse Burn-Rate & Capital Efficiency
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-[#1a5c3e] bg-[#1a5c3e]/10 px-2.5 py-0.5 rounded-md border border-[#1a5c3e]/20">
                  {burnRatePct.toFixed(1)}% Deployed
                </span>
              </div>

              {/* Multi-tier Capital Deployment Bar */}
              <div>
                <div className="h-2.5 w-full bg-[#e2e5ea] rounded-full overflow-hidden flex border border-[#e2e5ea] p-0.5">
                  <div
                    style={{ width: `${burnRatePct}%` }}
                    title={`Spent: ₹${spent.toLocaleString('en-IN')} (${burnRatePct.toFixed(1)}%)`}
                    className="bg-[#33404f] rounded-l-full transition-all duration-500"
                  />
                  <div
                    style={{ width: `${escrowExposurePct}%` }}
                    title={`In Escrow: ₹${locked.toLocaleString('en-IN')} (${escrowExposurePct.toFixed(1)}%)`}
                    className="bg-amber-500 transition-all duration-500"
                  />
                  <div
                    style={{ width: `${availablePct}%` }}
                    title={`Available: ₹${available.toLocaleString('en-IN')} (${availablePct.toFixed(1)}%)`}
                    className="bg-[#1a5c3e] rounded-r-full transition-all duration-500"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#6b7a8d] mt-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#33404f]" />
                    Invested: <strong className="text-[#33404f] font-mono">₹{spent.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    In Escrow: <strong className="text-[#33404f] font-mono">₹{locked.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1a5c3e]" />
                    Runway: <strong className="text-[#1a5c3e] font-mono">₹{available.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>

              {/* Metric Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-md bg-[#f1f4f7] border border-[#e2e5ea]">
                  <span className="text-[9px] uppercase font-bold text-[#6b7a8d] block">Total Purse</span>
                  <span className="font-semibold text-sm sm:text-base text-[#33404f] font-mono tabular-nums mt-0.5 block">
                    ₹{initial.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-[#f1f4f7] border border-[#e2e5ea]">
                  <span className="text-[9px] uppercase font-bold text-[#6b7a8d] block">Capital Spent</span>
                  <span className="font-semibold text-sm sm:text-base text-[#33404f] font-mono tabular-nums mt-0.5 block">
                    ₹{spent.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-[#f1f4f7] border border-[#e2e5ea]">
                  <span className="text-[9px] uppercase font-bold text-[#6b7a8d] block">Avg Lot Cost</span>
                  <span className="font-semibold text-sm sm:text-base text-[#33404f] font-mono tabular-nums mt-0.5 block">
                    ₹{avgAcquisitionCost.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-[#f1f4f7] border border-[#e2e5ea]">
                  <span className="text-[9px] uppercase font-bold text-[#6b7a8d] block">Liquid Runway</span>
                  <span className="font-semibold text-sm sm:text-base text-[#1a5c3e] font-mono tabular-nums mt-0.5 block">
                    ₹{available.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Sector Diversification Breakdown (5 Key Sectors) */}
            <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#1a5c3e]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#33404f]">
                    Sector Diversification (5 Pillars)
                  </h3>
                </div>
                <span className="text-[10px] text-[#6b7a8d] font-mono">
                  CleanTech · MedTech · AgriTech · FinTech · DeepTech
                </span>
              </div>

              <div className="space-y-3">
                {sectorBreakdown.map((sec) => {
                  const Icon = sec.meta.icon;
                  return (
                    <div key={sec.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded-md ${sec.meta.badgeBg} ${sec.meta.color} border ${sec.meta.badgeBorder}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold text-[#33404f]">{sec.name}</span>
                          <span className="text-[10px] font-mono text-[#6b7a8d] bg-[#f1f4f7] px-1.5 py-0.5 rounded border border-[#e2e5ea]">
                            {sec.count} lot{sec.count === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[#6b7a8d] text-[11px] tabular-nums">
                            ₹{sec.amount.toLocaleString('en-IN')}
                          </span>
                          <span className={`font-mono font-bold text-xs ${sec.meta.color} min-w-[42px] text-right`}>
                            {sec.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="h-1.5 w-full bg-[#f1f4f7] rounded-full overflow-hidden border border-[#e2e5ea]">
                        <div
                          style={{ width: `${sec.percentage}%` }}
                          className={`h-full ${sec.meta.barColor} transition-all duration-500 rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4 Capital Allocation Risk Indicators */}
            <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#33404f]">
                    Capital Allocation Risk Indicators
                  </h3>
                </div>
                <span className="text-[10px] text-[#6b7a8d]">4 Live Safety Checks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Sector Overconcentration */}
                <div
                  className={`p-3.5 rounded-md border transition-all ${
                    riskAnalysis.overconcentration.triggered
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-[#f1f4f7] border-[#e2e5ea] text-[#33404f]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                      {riskAnalysis.overconcentration.triggered ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      Overconcentration
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                        riskAnalysis.overconcentration.triggered
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {riskAnalysis.overconcentration.triggered ? 'Alert (>40%)' : 'Balanced'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#6b7a8d]">
                    {riskAnalysis.overconcentration.description}
                  </p>
                </div>

                {/* 2. Rapid Depletion Velocity */}
                <div
                  className={`p-3.5 rounded-md border transition-all ${
                    riskAnalysis.depletionVelocity.triggered
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-[#f1f4f7] border-[#e2e5ea] text-[#33404f]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                      {riskAnalysis.depletionVelocity.triggered ? (
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      Depletion Velocity
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                        riskAnalysis.depletionVelocity.triggered
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {riskAnalysis.depletionVelocity.triggered ? 'High Burn' : 'Paced'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#6b7a8d]">
                    {riskAnalysis.depletionVelocity.description}
                  </p>
                </div>

                {/* 3. Active Escrow Exposure */}
                <div
                  className={`p-3.5 rounded-md border transition-all ${
                    riskAnalysis.escrowExposure.triggered
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-[#f1f4f7] border-[#e2e5ea] text-[#33404f]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                      {riskAnalysis.escrowExposure.triggered ? (
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      Escrow Exposure
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                        riskAnalysis.escrowExposure.triggered
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {riskAnalysis.escrowExposure.triggered ? 'High Hold (>50%)' : 'Liquid'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#6b7a8d]">
                    {riskAnalysis.escrowExposure.description}
                  </p>
                </div>

                {/* 4. Low Runway Buffer */}
                <div
                  className={`p-3.5 rounded-md border transition-all ${
                    riskAnalysis.runwayBuffer.triggered
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-[#f1f4f7] border-[#e2e5ea] text-[#33404f]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                      {riskAnalysis.runwayBuffer.triggered ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      Runway Buffer
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                        riskAnalysis.runwayBuffer.triggered
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {riskAnalysis.runwayBuffer.triggered ? '< ₹10k Buffer' : 'Healthy'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#6b7a8d]">
                    {riskAnalysis.runwayBuffer.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Acquired Lots Portfolio Ledger */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#33404f] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#1a5c3e]" />
                  <span>Acquired Venture Portfolio ({wonCount})</span>
                </h3>
                <span className="text-xs font-mono font-bold text-[#1a5c3e]">
                  Total: ₹{spent.toLocaleString('en-IN')}
                </span>
              </div>

              {wonStartups.length === 0 ? (
                <div className="p-8 rounded-xl bg-white border border-[#e2e5ea] text-center text-[#6b7a8d] flex flex-col items-center justify-center">
                  <Briefcase className="w-10 h-10 text-[#6b7a8d]/40 mb-2" />
                  <p className="text-sm font-semibold text-[#33404f]">No startup allocations acquired yet</p>
                  <p className="text-xs text-[#6b7a8d] max-w-sm mt-1">
                    When your team wins a startup round, its telemetry, sector distribution, and cap allocation will be logged here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {wonStartups.map((s) => {
                    const meta = getSectorMeta(s.sector);
                    const Icon = meta.icon;
                    return (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl bg-white border border-[#e2e5ea] hover:border-[#1a5c3e] transition flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#1a5c3e]/10 text-[#1a5c3e] text-[10px] font-mono font-bold border border-[#1a5c3e]/20">
                              LOT #{s.display_order}
                            </span>
                            <h4 className="font-semibold text-[#33404f] text-sm">{s.name}</h4>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md ${meta.badgeBg} ${meta.badgeText} border ${meta.badgeBorder} flex items-center gap-1 font-medium`}
                            >
                              <Icon className="w-3 h-3" />
                              {s.sector}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6b7a8d] italic line-clamp-1">
                            &ldquo;{s.tagline}&rdquo;
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[9px] uppercase font-bold text-emerald-800 block">
                            Won Price
                          </span>
                          <span className="font-semibold text-sm sm:text-base text-[#1a5c3e] font-mono tabular-nums">
                            ₹{Number(s.winning_bid_amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="px-6 py-4 border-t border-[#e2e5ea] bg-[#f9f8f6] flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5 text-xs text-[#6b7a8d]">
              <Sparkles className="w-4 h-4 text-[#1a5c3e]" />
              Verified on SEEP 4.0 Realtime Ledger
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition active:scale-[0.98]"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
