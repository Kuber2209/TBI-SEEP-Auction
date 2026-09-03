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
    <div className="rounded-xl p-5 bg-[#f9f8f6] border border-[#e2e5ea] flex flex-col h-full max-h-[480px] shadow-sm text-[#33404f]">
      <div className="flex items-center justify-between pb-3 border-b border-[#e2e5ea] mb-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-[#1a5c3e]" />
          <h3 className="text-sm font-semibold text-[#33404f]">
            Authoritative Event Audit Log
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#6b7a8d]" />
            <input
              type="text"
              placeholder="Search event type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 rounded-md bg-white border border-[#e2e5ea] text-xs text-[#33404f] placeholder:text-[#6b7a8d] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e] w-44"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Logs"
              className="p-1.5 rounded-md bg-white hover:bg-[#f1f4f7] text-[#33404f] border border-[#e2e5ea] transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto space-y-2 pr-1 flex-1 font-mono text-[11px]">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-[#6b7a8d] italic">
            No audit records matching query.
          </div>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              className="p-2.5 rounded-md bg-white border border-[#e2e5ea] flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-semibold text-[#1a5c3e] mr-2">[{e.event_type}]</span>
                <span className="text-[#33404f]">
                  {JSON.stringify(e.payload)}
                </span>
              </div>
              <span className="text-[#6b7a8d] text-[10px] shrink-0 font-mono">
                {new Date(e.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
