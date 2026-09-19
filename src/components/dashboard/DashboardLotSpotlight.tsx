'use client';

import React from 'react';
import { Startup } from '@/lib/supabase/types';

interface Props {
  startup: Startup | null;
  totalLots: number;
}

export function DashboardLotSpotlight({ startup, totalLots }: Props) {
  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[220px] gap-4">
        <div className="w-3 h-3 rounded-full bg-[#00ff88] animate-pulse" />
        <p className="text-[#4ade80] text-sm font-mono uppercase tracking-widest">
          Awaiting Next Lot
        </p>
        <h2 className="text-3xl font-bold text-white/60">Stage Ready</h2>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; pulse: boolean }> = {
    ACTIVE_BIDDING: { label: '🔴 LIVE BIDDING', color: 'text-[#00ff88] border-[#00ff88]/40 bg-[#00ff88]/10', pulse: true },
    PRESENTING:     { label: '📡 PRESENTING',   color: 'text-sky-400 border-sky-400/40 bg-sky-400/10',      pulse: false },
    PAUSED:         { label: '⏸ PAUSED',        color: 'text-amber-400 border-amber-400/40 bg-amber-400/10', pulse: false },
    SOLD:           { label: '✅ SOLD',          color: 'text-[#00ff88] border-[#00ff88]/50 bg-[#00ff88]/10', pulse: false },
    UNSOLD:         { label: '⛔ UNSOLD',        color: 'text-red-400 border-red-400/40 bg-red-400/10',      pulse: false },
    UPCOMING:       { label: '⏳ UPCOMING',      color: 'text-white/50 border-white/20 bg-white/5',          pulse: false },
  };

  const cfg = statusConfig[startup.status] || statusConfig.UPCOMING;

  return (
    <div className="flex flex-col justify-between h-full gap-5">
      {/* Lot meta */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-white/40 uppercase tracking-widest">
          Lot {startup.display_order} / {totalLots}
        </span>
        <span
          className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${cfg.color}`}
        >
          {cfg.pulse && (
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping shrink-0" />
          )}
          {cfg.label}
        </span>
      </div>

      {/* Startup name */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88]/70 mb-1">
          {startup.sector}
        </div>
        <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
          {startup.name}
        </h2>
        {startup.tagline && (
          <p className="text-white/50 text-sm mt-2 leading-snug">
            {startup.tagline}
          </p>
        )}
      </div>

      {/* Founders */}
      {startup.founder_names && startup.founder_names.length > 0 && (
        <div className="text-xs text-white/40">
          <span className="text-white/25 mr-1.5">Founders</span>
          <span className="text-white/60 font-medium">
            {startup.founder_names.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
