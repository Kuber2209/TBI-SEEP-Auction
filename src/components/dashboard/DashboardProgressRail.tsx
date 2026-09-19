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
  SOLD:          { dot: 'bg-[#00ff88]',   label: 'SOLD',      bg: 'bg-[#00ff88]/5',   border: 'border-[#00ff88]/20', text: 'text-[#00ff88]/80'  },
  UNSOLD:        { dot: 'bg-red-500',      label: 'UNSOLD',    bg: 'bg-red-500/5',     border: 'border-red-500/20',   text: 'text-red-400/60'    },
  ACTIVE_BIDDING:{ dot: 'bg-[#00ff88] animate-ping', label: 'LIVE', bg: 'bg-[#00ff88]/10', border: 'border-[#00ff88]/40', text: 'text-[#00ff88]' },
  PRESENTING:    { dot: 'bg-sky-400',      label: 'ON STAGE',  bg: 'bg-sky-400/5',     border: 'border-sky-400/20',   text: 'text-sky-400/80'    },
  PAUSED:        { dot: 'bg-amber-400',    label: 'PAUSED',    bg: 'bg-amber-400/5',   border: 'border-amber-400/20', text: 'text-amber-400/80'  },
  UPCOMING:      { dot: 'bg-white/20',     label: 'UPCOMING',  bg: 'bg-white/[0.02]',  border: 'border-white/8',      text: 'text-white/25'      },
};

export function DashboardProgressRail({ startups, activeStartupId }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 mb-1">
        Auction Progress — {startups.filter((s) => s.status === 'SOLD' || s.status === 'UNSOLD').length} / {startups.length} Lots Closed
      </span>

      <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {startups.map((s) => {
          const cfg = LOT_STATUS_CONFIG[s.status] || LOT_STATUS_CONFIG.UPCOMING;
          const isActive = s.id === activeStartupId;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md border transition-all ${cfg.bg} ${cfg.border} ${
                isActive ? 'ring-1 ring-[#00ff88]/30' : ''
              }`}
            >
              {/* Status dot */}
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />

              {/* Lot # */}
              <span className="text-[10px] font-mono text-white/30 w-5 shrink-0">
                #{s.display_order}
              </span>

              {/* Name */}
              <span className={`text-xs font-semibold truncate flex-1 ${isActive ? 'text-white' : cfg.text}`}>
                {s.name}
              </span>

              {/* Status label or winner */}
              <span className={`text-[9px] font-mono uppercase shrink-0 ${cfg.text}`}>
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
