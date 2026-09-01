'use client';

import React from 'react';
import { Startup } from '@/lib/supabase/types';
import {
  Building2,
  Users2,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  Coins,
  Cpu,
  Sprout,
  Rocket,
  Shield,
  Layers,
} from 'lucide-react';

interface StartupHeroProps {
  startup: Startup | null;
  totalLots: number;
}

export function StartupHero({ startup, totalLots }: StartupHeroProps) {
  if (!startup) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[360px] border-navy-800">
        <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-navy-800 flex items-center justify-center text-navy-700 mb-4 shadow-inner">
          <Building2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-display font-bold text-slate-300">
          Awaiting Startup Presentation
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          The auctioneer will assign the next presenting startup from the live stage shortly.
        </p>
      </div>
    );
  }

  const getSectorIcon = (sector: string) => {
    const s = sector.toLowerCase();
    if (s.includes('clean') || s.includes('ev')) return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
    if (s.includes('med') || s.includes('health') || s.includes('bio')) return <Activity className="w-3.5 h-3.5 text-rose-400" />;
    if (s.includes('agri')) return <Sprout className="w-3.5 h-3.5 text-lime-400" />;
    if (s.includes('fin') || s.includes('web3')) return <Coins className="w-3.5 h-3.5 text-gold-400" />;
    if (s.includes('cyber') || s.includes('defense')) return <Shield className="w-3.5 h-3.5 text-blue-400" />;
    if (s.includes('deep') || s.includes('aero') || s.includes('space')) return <Rocket className="w-3.5 h-3.5 text-cyan-400" />;
    if (s.includes('robot') || s.includes('ai')) return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
    return <Layers className="w-3.5 h-3.5 text-seep-sky" />;
  };

  const getStatusBadge = () => {
    switch (startup.status) {
      case 'PRESENTING':
        return (
          <span className="px-3 py-1.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5 shadow-blue animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            ON STAGE PITCHING
          </span>
        );
      case 'ACTIVE_BIDDING':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-2 shadow-emerald animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE BIDDING OPEN
          </span>
        );
      case 'PAUSED':
        return (
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            BIDDING PAUSED
          </span>
        );
      case 'SOLD':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gold-500/25 text-gold-300 border border-gold-500/50 flex items-center gap-1.5 shadow-gold">
            <CheckCircle2 className="w-4 h-4 text-gold-400" />
            ROUND WON (SOLD)
          </span>
        );
      case 'UNSOLD':
        return (
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            UNSOLD ROUND
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            UPCOMING LOT
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 lg:p-8 relative overflow-hidden border-navy-800/80 shadow-2xl flex flex-col justify-between h-full group">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-gold-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-gold-500/15 transition duration-500" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-seep-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Lot Header & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-navy-900 border border-navy-700 font-mono text-xs font-bold text-gold-400 shadow-inner">
              LOT #{startup.display_order} of {totalLots}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-navy-900/90 text-slate-200 border border-navy-700 text-xs font-semibold">
              {getSectorIcon(startup.sector)}
              <span>{startup.sector}</span>
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Startup Title & Tagline */}
        <div className="mb-5">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white tracking-tight">
            {startup.name}
          </h2>
          <p className="text-sm sm:text-base font-medium text-gold-300/95 mt-2 italic flex items-center gap-2 leading-snug">
            <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
            &ldquo;{startup.tagline}&rdquo;
          </p>
        </div>

        {/* Founders Chips */}
        {startup.founder_names && startup.founder_names.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-5 bg-navy-950/70 rounded-2xl p-3 border border-navy-800 shadow-inner">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <Users2 className="w-4 h-4 text-gold-400" />
              Founders:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {startup.founder_names.map((founder, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-full bg-navy-900 border border-navy-700 text-slate-200 font-medium text-xs"
                >
                  {founder}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {startup.description && (
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-navy-900/50 rounded-2xl p-4 sm:p-5 border border-navy-800/80 shadow-inner">
            {startup.description}
          </div>
        )}
      </div>

      {/* Base Valuation Valuation Card */}
      <div className="mt-6 pt-5 border-t border-navy-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 block">
            Base Valuation Price
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Opening Floor Price</span>
        </div>
        <div className="text-right">
          <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-tight">
            ₹ {Number(startup.base_price).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
