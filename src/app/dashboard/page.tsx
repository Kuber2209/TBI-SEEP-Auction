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
    <div className="flex flex-col h-screen w-screen overflow-hidden select-none bg-[#f0f5f1] text-[#203126]">
      {/* ── SOLD OVERLAY ─────────────────────────────────────────────────────── */}
      {soldStartup && (
        <SoldOverlay startup={soldStartup} onDismiss={clearSoldStartup} />
      )}

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-[#cad7cc] shrink-0 shadow-[0_1px_3px_rgba(32,49,38,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a5c3e] flex items-center justify-center shrink-0 shadow-xs">
            <span className="text-white font-black text-xs tracking-tight">TBI</span>
          </div>
          <div>
            <span className="text-[#203126] font-bold text-sm tracking-tight">BITS TBI</span>
            <span className="text-[#cad7cc] text-sm font-light mx-2">·</span>
            <span className="text-[#1a5c3e] font-black text-sm tracking-tight">
              SEEP 4.0
            </span>
            <span className="text-[#56695e] text-xs font-mono ml-2 hidden sm:inline font-medium">
              Live Startup Auction
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session && (
            <span className="text-[11px] font-mono text-[#56695e] hidden md:block uppercase tracking-wider font-semibold">
              {session.name}
              {session.is_rehearsal && (
                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  REHEARSAL
                </span>
              )}
            </span>
          )}
          <span className="text-sm font-mono text-[#203126] font-bold tabular-nums px-2.5 py-1 rounded-md bg-white border border-[#cad7cc] shadow-2xs">
            {clock}
          </span>
        </div>
      </header>

      {/* ── MAIN GRID ────────────────────────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden min-h-0 bg-[#f0f5f1]">
        {/* LEFT COLUMN — Lot Spotlight + Big Bid (7 cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 overflow-hidden">
          {/* Lot Spotlight */}
          <section className="flex-1 min-h-0 p-6 lg:p-7 rounded-xl bg-white border border-[#cad7cc] shadow-sm flex flex-col justify-between overflow-hidden">
            <DashboardLotSpotlight
              startup={activeStartup}
              totalLots={stats.totalLots}
            />
          </section>

          {/* Big Bid Display */}
          <section
            className="shrink-0 p-6 rounded-xl bg-white border border-[#cad7cc] shadow-sm flex flex-col items-center justify-center"
            style={{ minHeight: '220px', maxHeight: '250px' }}
          >
            <DashboardBidDisplay
              startup={activeStartup}
              recentBids={recentBids}
            />
          </section>
        </div>

        {/* RIGHT COLUMN — Leaderboard + Progress Rail (5 cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 overflow-hidden">
          {/* Leaderboard */}
          <section className="flex-1 min-h-0 p-5 rounded-xl bg-white border border-[#cad7cc] shadow-sm overflow-hidden flex flex-col">
            <DashboardLeaderboard leaderboard={leaderboard} />
          </section>

          {/* Progress Rail */}
          <section className="flex-1 min-h-0 p-5 rounded-xl bg-white border border-[#cad7cc] shadow-sm overflow-hidden flex flex-col">
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
