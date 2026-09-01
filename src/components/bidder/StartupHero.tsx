'use client';

import React from 'react';
import { Startup } from '@/lib/supabase/types';
import { Building2, Users2, Sparkles, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

interface StartupHeroProps {
  startup: Startup | null;
  totalLots: number;
}

export function StartupHero({ startup, totalLots }: StartupHeroProps) {
  if (!startup) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[320px]">
        <Building2 className="w-12 h-12 text-navy-700 mb-3" />
        <h3 className="text-lg font-bold text-slate-300">Awaiting Startup Presentation</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          The auctioneer will assign the next presenting startup from the stage shortly.
        </p>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (startup.status) {
      case 'PRESENTING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            ON STAGE PITCHING
          </span>
        );
      case 'ACTIVE_BIDDING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE BIDDING OPEN
          </span>
        );
      case 'PAUSED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            BIDDING PAUSED
          </span>
        );
      case 'SOLD':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />
            ROUND COMPLETED (SOLD)
          </span>
        );
      case 'UNSOLD':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            UNSOLD
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            UPCOMING
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 lg:p-7 relative overflow-hidden border-navy-800 shadow-xl flex flex-col justify-between h-full">
      {/* Background watermark badge */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Top Lot info */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-navy-800 border border-navy-700 font-mono text-xs font-bold text-gold-400">
              LOT #{startup.display_order} of {totalLots}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-seep-blue/15 text-seep-sky border border-seep-blue/30 text-xs font-semibold">
              <Tag className="w-3 h-3" />
              {startup.sector}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Startup Title & Tagline */}
        <div className="mb-4">
          <h2 className="text-2xl lg:text-3xl font-display font-black text-white tracking-tight">
            {startup.name}
          </h2>
          <p className="text-sm font-medium text-gold-300/90 mt-1 italic flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0 inline" />
            &ldquo;{startup.tagline}&rdquo;
          </p>
        </div>

        {/* Founders */}
        {startup.founder_names && startup.founder_names.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-4 bg-navy-950/60 rounded-lg p-2.5 border border-navy-800">
            <Users2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-400">Founders:</span>
            <span className="font-medium text-slate-200">
              {startup.founder_names.join(', ')}
            </span>
          </div>
        )}

        {/* Description */}
        {startup.description && (
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed bg-navy-900/40 rounded-xl p-3.5 border border-navy-800/80">
            {startup.description}
          </p>
        )}
      </div>

      {/* Base Price Card */}
      <div className="mt-6 pt-4 border-t border-navy-800/80 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Base Valuation Price
        </span>
        <span className="font-mono text-lg font-bold text-white">
          ₹ {Number(startup.base_price).toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
