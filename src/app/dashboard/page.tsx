'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { DashboardLotSpotlight } from '@/components/dashboard/DashboardLotSpotlight';
import { DashboardBidDisplay } from '@/components/dashboard/DashboardBidDisplay';
import { DashboardLeaderboard } from '@/components/dashboard/DashboardLeaderboard';
import { DashboardProgressRail } from '@/components/dashboard/DashboardProgressRail';
import { DashboardStatBar } from '@/components/dashboard/DashboardStatBar';
import { DashboardTicker } from '@/components/dashboard/DashboardTicker';
import { SoldOverlay } from '@/components/dashboard/SoldOverlay';

// Track which startup just sold so we only show overlay once per lot
function useSoldOverlay(activeStartup: any, startups: any[]) {
  const [soldStartup, setSoldStartup] = useState<any>(null);
  const prevStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!startups || startups.length === 0) return;

    for (const s of startups) {
      const prev = prevStatusRef.current[s.id];
      if (prev && prev !== 'SOLD' && s.status === 'SOLD') {
        // Lot just transitioned to SOLD — show overlay
        setSoldStartup(s);
      }
      prevStatusRef.current[s.id] = s.status;
    }
  }, [startups]);

  return {
    soldStartup,
    clearSoldStartup: () => setSoldStartup(null),
  };
}

// Live clock
function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function DashboardPage() {
  const {
    session,
    startups,
    activeStartup,
    recentBids,
    leaderboard,
    stats,
    recentEvents,
    connectionStatus,
    lastSyncedAt,
  } = useDashboardSync();

  const { soldStartup, clearSoldStartup } = useSoldOverlay(activeStartup, startups);
  const clock = useClock();

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden select-none"
      style={{
        background: 'linear-gradient(135deg, #060d08 0%, #0a1410 50%, #060d08 100%)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── SOLD OVERLAY ─────────────────────────────────────────────────────── */}
      {soldStartup && (
        <SoldOverlay startup={soldStartup} onDismiss={clearSoldStartup} />
      )}

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          {/* TBI Logo placeholder — replace with <Image> if logo asset available */}
          <div className="w-8 h-8 rounded-lg bg-[#00ff88]/20 border border-[#00ff88]/30 flex items-center justify-center shrink-0">
            <span className="text-[#00ff88] font-black text-xs">T</span>
          </div>
          <div>
            <span className="text-white font-black text-sm tracking-tight">TBI</span>
            <span className="text-white/30 text-sm font-light mx-2">·</span>
            <span className="text-[#00ff88] font-bold text-sm tracking-tight">
              SEEP 4.0
            </span>
            <span className="text-white/30 text-xs font-mono ml-2 hidden sm:inline">
              Live Startup Auction
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session && (
            <span className="text-[10px] font-mono text-white/30 hidden md:block uppercase tracking-widest">
              {session.name}
              {session.is_rehearsal && (
                <span className="ml-2 text-amber-400/70">[REHEARSAL]</span>
              )}
            </span>
          )}
          <span className="text-sm font-mono text-white/50 tabular-nums">{clock}</span>
        </div>
      </header>

      {/* ── MAIN GRID ────────────────────────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-12 gap-px overflow-hidden min-h-0">
        {/* LEFT COLUMN — Lot Spotlight + Big Bid (7 cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-px overflow-hidden">
          {/* Lot Spotlight */}
          <section className="flex-1 min-h-0 p-6 border-b border-r border-white/8 bg-white/[0.01]">
            <DashboardLotSpotlight
              startup={activeStartup}
              totalLots={stats.totalLots}
            />
          </section>

          {/* Big Bid Display */}
          <section
            className="shrink-0 p-6 border-r border-white/8"
            style={{ minHeight: '220px', maxHeight: '260px' }}
          >
            <DashboardBidDisplay
              startup={activeStartup}
              recentBids={recentBids}
            />
          </section>
        </div>

        {/* RIGHT COLUMN — Leaderboard + Progress Rail (5 cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-px overflow-hidden">
          {/* Leaderboard */}
          <section className="flex-1 min-h-0 p-5 border-b border-white/8 bg-white/[0.01] overflow-hidden">
            <DashboardLeaderboard leaderboard={leaderboard} />
          </section>

          {/* Progress Rail */}
          <section className="flex-1 min-h-0 p-5 bg-white/[0.005] overflow-hidden">
            <DashboardProgressRail
              startups={startups}
              activeStartupId={session?.active_startup_id}
            />
          </section>
        </div>
      </main>

      {/* ── STAT BAR ─────────────────────────────────────────────────────────── */}
      <DashboardStatBar
        stats={stats}
        connectionStatus={connectionStatus}
        lastSyncedAt={lastSyncedAt}
      />

      {/* ── TICKER ───────────────────────────────────────────────────────────── */}
      <DashboardTicker
        events={recentEvents}
        recentBids={recentBids}
        activeStartupName={activeStartup?.name ?? null}
      />
    </div>
  );
}
