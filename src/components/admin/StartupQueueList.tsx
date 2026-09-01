'use client';

import React from 'react';
import { Startup } from '@/lib/supabase/types';
import { ListOrdered, CheckCircle2, Play, Radio, Tag } from 'lucide-react';

interface StartupQueueListProps {
  startups: Startup[];
  activeStartupId?: string | null;
  onSelectStartup: (startup: Startup) => void;
}

export function StartupQueueList({
  startups,
  activeStartupId,
  onSelectStartup,
}: StartupQueueListProps) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-navy-800 flex flex-col h-full max-h-[600px]">
      <div className="flex items-center justify-between pb-3 border-b border-navy-800 mb-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-gold-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Startup Presentation Pipeline
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {startups.length} Lots
        </span>
      </div>

      <div className="overflow-y-auto space-y-2 pr-1 flex-1">
        {startups.map((startup) => {
          const isActive = startup.id === activeStartupId;

          return (
            <button
              key={startup.id}
              onClick={() => onSelectStartup(startup)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                isActive
                  ? 'bg-gold-500/15 border-gold-500/50 shadow-md'
                  : 'bg-navy-950/40 hover:bg-navy-900/60 border-navy-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold ${
                    isActive
                      ? 'bg-gold-500 text-navy-950'
                      : 'bg-navy-800 text-slate-400'
                  }`}
                >
                  {startup.display_order}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white line-clamp-1">
                      {startup.name}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {startup.sector} · Base ₹{Number(startup.base_price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    startup.status === 'ACTIVE_BIDDING'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                      : startup.status === 'PRESENTING'
                      ? 'bg-blue-500/20 text-blue-300'
                      : startup.status === 'SOLD'
                      ? 'bg-gold-500/20 text-gold-400 font-mono'
                      : startup.status === 'UNSOLD'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {startup.status === 'SOLD' && startup.winning_bid_amount
                    ? `SOLD ₹${Number(startup.winning_bid_amount).toLocaleString('en-IN')}`
                    : startup.status.replace('_', ' ')}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
