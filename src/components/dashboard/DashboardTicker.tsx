'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TickerEvent } from '@/hooks/useDashboardSync';

interface Props {
  events: TickerEvent[];
  recentBids: any[];
  activeStartupName: string | null;
}

interface TickerItem {
  id: string;
  text: string;
  ts: string;
}

function eventToText(
  event: TickerEvent,
  activeStartupName: string | null
): string | null {
  const p = event.payload || {};

  switch (event.event_type) {
    case 'BID_PLACED':
      return `💸 ${p.team_name || 'A team'} bid ₹${Number(p.amount || 0).toLocaleString('en-IN')} on ${p.startup_name || activeStartupName || 'active lot'}`;
    case 'AUCTION_CLOSED':
      if (p.winner_team_name) {
        return `🏆 ${p.winner_team_name} won ${p.startup_name || 'a lot'} at ₹${Number(p.winning_bid || 0).toLocaleString('en-IN')}`;
      }
      return `⛔ ${p.startup_name || 'A lot'} closed unsold`;
    case 'STAGE_STATUS_CHANGED':
      if (p.new_status === 'ACTIVE_BIDDING')
        return `🔴 Bidding opened on ${p.startup_name || activeStartupName || 'a lot'}`;
      if (p.new_status === 'PRESENTING')
        return `📡 ${p.startup_name || 'Next startup'} is now presenting`;
      if (p.new_status === 'PAUSED')
        return `⏸ Bidding paused on ${p.startup_name || activeStartupName || 'active lot'}`;
      return null;
    case 'BID_VOIDED':
      return `❌ A bid was voided — ${p.reason || 'dispute'}`;
    case 'SESSION_STARTED':
      return '🚀 Auction session has started!';
    case 'AUCTION_REOPENED':
      return `🔄 ${p.startup_name || 'A lot'} was reopened for bidding`;
    default:
      return null;
  }
}

export function DashboardTicker({ events, recentBids, activeStartupName }: Props) {
  const [items, setItems] = useState<TickerItem[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  const prevStartupName = useRef<string | null>(null);

  // Clear stale bid-derived ticker items when the active lot changes
  useEffect(() => {
    if (activeStartupName !== prevStartupName.current) {
      prevStartupName.current = activeStartupName;
      // Remove synthetic bid entries from the old lot (they have prefix 'bid-')
      setItems((prev) => prev.filter((item) => !item.id.startsWith('bid-')));
      // Also purge synthetic bid IDs from seenIds so new lot's first bid registers
      const toDelete: string[] = [];
      seenIds.current.forEach((id) => { if (id.startsWith('bid-')) toDelete.push(id); });
      toDelete.forEach((id) => seenIds.current.delete(id));
    }
  }, [activeStartupName]);

  useEffect(() => {
    const newItems: TickerItem[] = [];

    // Process auction events
    for (const ev of events) {
      if (seenIds.current.has(ev.id)) continue;
      const text = eventToText(ev, activeStartupName);
      if (text) {
        newItems.push({ id: ev.id, text, ts: ev.created_at });
        seenIds.current.add(ev.id);
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...newItems, ...prev].slice(0, 8));
    }
  }, [events, activeStartupName]);

  // Synthesize ticker items from recent bids (fallback when events table is sparse)
  useEffect(() => {
    if (recentBids.length === 0) return;
    const top = recentBids[0];
    if (!top) return;
    const syntheticId = `bid-${top.id}`;
    if (seenIds.current.has(syntheticId)) return;

    const teamName = top.bidder_profile?.team_name || 'A team';
    const amount = Number(top.amount || 0).toLocaleString('en-IN');
    const text = `💸 ${teamName} bid ₹${amount}${activeStartupName ? ` on ${activeStartupName}` : ''}`;

    seenIds.current.add(syntheticId);
    setItems((prev) => [{ id: syntheticId, text, ts: top.created_at }, ...prev].slice(0, 8));
  }, [recentBids, activeStartupName]);

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 px-6 py-2 bg-[#eff4f0] border-t border-[#cad7cc]">
        <span className="text-xs font-mono text-[#8a9a8f] uppercase tracking-wider font-semibold">
          Live Feed · Waiting for auction activity…
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-6 py-2 bg-[#eff4f0] border-t border-[#cad7cc] overflow-hidden">
      <span className="text-[10px] font-mono font-bold text-white bg-[#1a5c3e] px-2 py-0.5 rounded uppercase tracking-wider shrink-0 shadow-2xs">
        LIVE FEED
      </span>
      <span className="w-px h-3.5 bg-[#cad7cc] shrink-0" />
      <div className="overflow-hidden flex-1">
        <div
          className="flex items-center gap-6 animate-marquee whitespace-nowrap"
          style={{ willChange: 'transform' }}
        >
          {[...items, ...items].map((item, i) => (
            <span key={`${item.id}-${i}`} className="text-xs text-[#203126] font-mono font-medium shrink-0">
              {item.text}
              <span className="mx-4 text-[#8a9a8f]">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
