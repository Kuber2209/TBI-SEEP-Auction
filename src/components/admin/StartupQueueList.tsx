'use client';

import React, { useState } from 'react';
import { Startup } from '@/lib/supabase/types';
import { ListOrdered, Search, Tag, Sparkles } from 'lucide-react';

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
    <div className="glass-card rounded-[24px] p-6 border border-white/[0.07] flex flex-col h-full max-h-[620px] shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.07] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
              Startup Queue
            </h3>
            <p className="text-[10px] text-slate-400">12 Scheduled Venture Lots</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-300 bg-navy-900/80 px-2.5 py-1 rounded-lg border border-white/[0.07]">
          {startups.length} Lots
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
          className="w-full pl-8 pr-3 py-1.5 rounded-[12px] bg-navy-950 border border-white/[0.07] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-gold-500"
        />
      </div>

      <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
        {filtered.map((startup) => {
          const isActive = startup.id === activeStartupId;

          return (
            <button
              key={startup.id}
              onClick={() => onSelectStartup(startup)}
              className={`w-full text-left p-3.5 rounded-[16px] border transition-all duration-200 flex items-center justify-between ${
                isActive
                  ? 'bg-gold-500/15 border-gold-500/60 shadow-sm'
                  : 'bg-navy-950/50 hover:bg-navy-900/80 border-white/[0.07] text-slate-300 glass-card-interactive'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-[12px] flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                    isActive
                      ? 'bg-gold-500 text-navy-950 shadow-sm'
                      : 'bg-navy-800 text-slate-400 border border-navy-700'
                  }`}
                >
                  #{startup.display_order}
                </span>

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                    {startup.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {startup.sector} · Floor ₹{Number(startup.base_price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider block ${
                    startup.status === 'ACTIVE_BIDDING'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                      : startup.status === 'PRESENTING'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : startup.status === 'SOLD'
                      ? 'bg-gold-500/20 text-gold-400 font-mono border border-gold-500/30'
                      : startup.status === 'UNSOLD'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
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
