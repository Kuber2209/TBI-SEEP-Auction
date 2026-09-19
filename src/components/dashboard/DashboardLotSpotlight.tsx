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
      <div className="flex flex-col items-center justify-center h-full min-h-[220px] gap-3 text-center">
        <div className="w-3.5 h-3.5 rounded-full bg-[#1a5c3e] animate-ping" />
        <span className="text-[#1a5c3e] text-xs font-mono font-bold uppercase tracking-widest">
          Awaiting Next Lot
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#203126]">
          Stage Operator Standby
        </h2>
        <p className="text-xs text-[#56695e] max-w-sm leading-relaxed">
          The next student startup pitch will appear here once called by the auction stage operator.
        </p>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; pulse: boolean }> = {
    ACTIVE_BIDDING: { label: 'LIVE BIDDING', color: 'text-emerald-800 bg-emerald-50 border-emerald-300', pulse: true },
    PRESENTING:     { label: 'PITCH IN PROGRESS', color: 'text-blue-800 bg-blue-50 border-blue-200', pulse: false },
    PAUSED:         { label: 'BIDDING PAUSED', color: 'text-amber-800 bg-amber-50 border-amber-200', pulse: false },
    SOLD:           { label: 'ACQUIRED (SOLD)', color: 'text-[#1a5c3e] bg-[#1a5c3e]/10 border-[#1a5c3e]/30', pulse: false },
    UNSOLD:         { label: 'PASSED (UNSOLD)', color: 'text-red-800 bg-red-50 border-red-200', pulse: false },
    UPCOMING:       { label: 'UPCOMING LOT', color: 'text-[#56695e] bg-[#e5ece6] border-[#cad7cc]', pulse: false },
  };

  const cfg = statusConfig[startup.status] || statusConfig.UPCOMING;

  return (
    <div className="flex flex-col justify-between h-full gap-5">
      {/* Lot meta & status header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#56695e] uppercase tracking-wider">
            Lot {startup.display_order} of {totalLots}
          </span>
          <span className="text-[#cad7cc]">·</span>
          <span className="inline-flex items-center text-[11px] font-mono font-bold uppercase tracking-wider text-[#1a5c3e] bg-[#1a5c3e]/10 px-2.5 py-0.5 rounded-md border border-[#1a5c3e]/20">
            {startup.sector}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs ${cfg.color}`}
        >
          {cfg.pulse && (
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
          )}
          {cfg.label}
        </span>
      </div>

      {/* Startup primary details */}
      <div className="space-y-3.5 my-auto">
        <h2
          className="font-black text-[#203126] leading-[1.08] tracking-tight"
          style={{ fontSize: 'clamp(2.75rem, 5vw, 4.5rem)' }}
        >
          {startup.name}
        </h2>
        {startup.tagline && (
          <p className="text-lg sm:text-xl text-[#56695e] leading-relaxed font-normal max-w-2xl">
            {startup.tagline}
          </p>
        )}
      </div>

      {/* Footer metadata: Founders & Floor */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#e2e5ea]">
        {startup.founder_names && startup.founder_names.length > 0 ? (
          <div className="text-xs text-[#56695e] flex items-center gap-1.5">
            <span className="font-semibold text-[#8a9a8f] uppercase tracking-wider text-[10px]">Founders:</span>
            <span className="font-medium text-[#203126]">
              {startup.founder_names.join(', ')}
            </span>
          </div>
        ) : <div />}

        <div className="text-xs font-mono text-[#56695e]">
          <span>Floor Reserve: </span>
          <strong className="text-[#1a5c3e] font-bold">
            ₹{Number(startup.base_price || 5000).toLocaleString('en-IN')}
          </strong>
        </div>
      </div>
    </div>
  );
}
