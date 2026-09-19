'use client';

import React from 'react';
import { Startup } from '@/lib/supabase/types';

interface Props {
  startups: Startup[];
  activeStartupId: string | null | undefined;
}

const LOT_STATUS_CONFIG: Record<
  string,
  { dot: string; label: string; bg: string; border: string; text: string }
> = {
  SOLD:           { dot: 'bg-[#1a5c3e]',   label: 'SOLD',      bg: 'bg-[#1a5c3e]/5',   border: 'border-[#1a5c3e]/25', text: 'text-[#1a5c3e]'  },
  UNSOLD:         { dot: 'bg-red-600',     label: 'UNSOLD',    bg: 'bg-red-50/70',     border: 'border-red-200',      text: 'text-red-800'    },
  ACTIVE_BIDDING: { dot: 'bg-emerald-600 animate-pulse', label: 'LIVE', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900 font-bold' },
  PRESENTING:     { dot: 'bg-blue-600',    label: 'ON STAGE',  bg: 'bg-blue-50/70',    border: 'border-blue-200',     text: 'text-blue-900'    },
  PAUSED:         { dot: 'bg-amber-600',   label: 'PAUSED',    bg: 'bg-amber-50/70',   border: 'border-amber-200',    text: 'text-amber-900'  },
  UPCOMING:       { dot: 'bg-[#cad7cc]',   label: 'UPCOMING',  bg: 'bg-white',         border: 'border-[#e2e5ea]',    text: 'text-[#56695e]'  },
};

export function DashboardProgressRail({ startups, activeStartupId }: Props) {
  const closedCount = startups.filter((s) => s.status === 'SOLD' || s.status === 'UNSOLD').length;

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#56695e]">
          Lot Progression
        </span>
        <span className="text-xs font-mono text-[#56695e]">
          <strong className="text-[#1a5c3e]">{closedCount}</strong> / {startups.length} Closed
        </span>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {startups.map((s) => {
          const cfg = LOT_STATUS_CONFIG[s.status] || LOT_STATUS_CONFIG.UPCOMING;
          const isActive = s.id === activeStartupId;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all ${cfg.bg} ${cfg.border} ${
                isActive ? 'ring-2 ring-[#1a5c3e] shadow-xs' : 'shadow-2xs'
              }`}
            >
              {/* Status dot */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

              {/* Lot # */}
              <span className="text-[10px] font-mono text-[#8a9a8f] font-semibold w-5 shrink-0">
                #{s.display_order}
              </span>

              {/* Name */}
              <span className="text-xs font-semibold truncate flex-1 text-[#203126]">
                {s.name}
              </span>

              {/* Status label or winner */}
              <span className={`text-[10px] font-mono uppercase font-bold shrink-0 ${cfg.text}`}>
                {s.status === 'SOLD' && s.winner_team_name
                  ? s.winner_team_name
                  : cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
