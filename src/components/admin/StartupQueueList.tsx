'use client';

import React, { useState } from 'react';
import { Startup } from '@/lib/supabase/types';
import { Search } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = startups.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-xl p-5 sm:p-6 bg-white dark:bg-[#070D1E] border border-slate-200/80 dark:border-white/[0.08] flex flex-col h-full max-h-[620px] shadow-sm transition-colors duration-150">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.06] mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Startup Queue
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {startups.length} Scheduled Venture Lots
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {filtered.length} visible
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by startup or sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
        {filtered.map((startup) => {
          const isActive = startup.id === activeStartupId;

          return (
            <button
              key={startup.id}
              onClick={() => onSelectStartup(startup)}
              className={`w-full text-left p-2.5 sm:p-3 rounded-lg border transition-colors flex items-center justify-between ${
                isActive
                  ? 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-[#0A1124] border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-navy-900/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  #{startup.display_order}
                </span>

                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {startup.name}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {startup.sector} · Floor ₹{Number(startup.base_price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider block ${
                    startup.status === 'ACTIVE_BIDDING'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : startup.status === 'PRESENTING'
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                      : startup.status === 'SOLD'
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono'
                      : startup.status === 'UNSOLD'
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                      : 'text-slate-400 dark:text-slate-500'
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
