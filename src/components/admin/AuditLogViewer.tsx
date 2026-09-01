'use client';

import React, { useState } from 'react';
import { AuctionEvent } from '@/lib/supabase/types';
import { ScrollText, Search, RefreshCw } from 'lucide-react';

interface AuditLogViewerProps {
  events: AuctionEvent[];
  onRefresh?: () => void;
}

export function AuditLogViewer({ events, onRefresh }: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = events.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.event_type.toLowerCase().includes(term) ||
      JSON.stringify(e.payload).toLowerCase().includes(term)
    );
  });

  return (
    <div className="glass-card rounded-2xl p-5 border border-navy-800 flex flex-col h-full max-h-[480px]">
      <div className="flex items-center justify-between pb-3 border-b border-navy-800 mb-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-gold-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Authoritative Event Audit Log
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search event type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 rounded-lg bg-navy-950 border border-navy-700 text-xs text-white placeholder:text-slate-500 w-44"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Logs"
              className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto space-y-2 pr-1 flex-1 font-mono text-[11px]">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500 italic">
            No audit records matching query.
          </div>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              className="p-2.5 rounded-lg bg-navy-950/60 border border-navy-900 flex items-start justify-between gap-3"
            >
              <div>
                <span className="font-bold text-gold-400 mr-2">[{e.event_type}]</span>
                <span className="text-slate-300">
                  {JSON.stringify(e.payload)}
                </span>
              </div>
              <span className="text-slate-500 text-[10px] shrink-0">
                {new Date(e.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
