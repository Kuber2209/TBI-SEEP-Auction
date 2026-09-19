'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { DashboardWelcomeScreen } from '@/components/dashboard/DashboardWelcomeScreen';
import { DashboardLotSpotlight } from '@/components/dashboard/DashboardLotSpotlight';
import { DashboardBidDisplay } from '@/components/dashboard/DashboardBidDisplay';
import { DashboardLeaderboard } from '@/components/dashboard/DashboardLeaderboard';
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
    activeLotLeaderboard,
    leaderboard,
    stats,
    recentEvents,
    connectionStatus,
    lastSyncedAt,
  } = useDashboardSync();

  const { soldStartup, clearSoldStartup } = useSoldOverlay(activeStartup, startups);
  const clock = useClock();

  const [userViewOverride, setUserViewOverride] = useState<'welcome' | 'arena' | null>(null);

  // Automatically transition dashboard view in sync with admin stage operations (both ways)
  const prevActiveStartupId = useRef<string | null>(null);
  useEffect(() => {
    const curActiveId = activeStartup?.id || null;
    const prevActiveId = prevActiveStartupId.current;

    if (!curActiveId) {
      // Admin cleared active lot / broadcasted Welcome Screen -> Auto-switch to Welcome Page!
      setUserViewOverride('welcome');
    } else if (curActiveId !== prevActiveId) {
      // Admin called, presented, or advanced a lot -> Auto-switch to Live Stage Arena!
      setUserViewOverride('arena');
    }

    prevActiveStartupId.current = curActiveId;
  }, [activeStartup?.id]);

  // Default to welcome screen if no active startup, otherwise live arena
  const viewMode = userViewOverride ?? (activeStartup ? 'arena' : 'welcome');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden select-none bg-[#f0f5f1] text-[#203126]">
      {/* ── SOLD OVERLAY ─────────────────────────────────────────────────────── */}
      {soldStartup && (
        <SoldOverlay startup={soldStartup} onDismiss={clearSoldStartup} />
      )}

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-[#cad7cc] shrink-0 shadow-[0_1px_3px_rgba(32,49,38,0.05)]">
        <div className="flex items-center gap-3.5">
          {/* Official TBI BITS Pilani Logo Badge */}
          <div className="h-10 px-2.5 py-1 rounded-lg bg-white border border-[#cad7cc] flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/images/tbi-bits-logo.png"
              alt="Technology Business Incubator - BITS Pilani Hyderabad Campus"
              className="h-8 w-auto object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-[#203126] text-base sm:text-lg leading-none">
                SEEP <span className="text-[#1a5c3e]">4.0</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {viewMode === 'welcome' ? 'Welcome Stage' : 'Live Stage'}
              </span>
            </div>
            <p className="text-[11px] text-[#56695e] font-medium tracking-normal mt-0.5">
              BITS Pilani Hyderabad · Live Startup Auction
            </p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#eff4f0] border border-[#cad7cc]">
          <button
            onClick={() => setUserViewOverride('welcome')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'welcome'
                ? 'bg-[#1a5c3e] text-white shadow-xs'
                : 'text-[#56695e] hover:text-[#203126]'
            }`}
          >
            <span>Welcome Stage</span>
          </button>
          <button
            onClick={() => setUserViewOverride('arena')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'arena'
                ? 'bg-[#1a5c3e] text-white shadow-xs'
                : 'text-[#56695e] hover:text-[#203126]'
            }`}
          >
            <span>Live Stage Arena</span>
            {activeStartup && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
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

      {/* ── MAIN CONTENT: WELCOME STAGE OR LIVE ARENA ─────────────────────────── */}
      {viewMode === 'welcome' ? (
        <DashboardWelcomeScreen
          startups={startups}
          session={session}
          stats={stats}
          activeStartup={activeStartup}
          onEnterArena={() => setUserViewOverride('arena')}
        />
      ) : (
        /* ── MAIN GRID ────────────────────────────────────────────────────────── */
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

          {/* RIGHT COLUMN — Active Startup Investor Leaderboard (5 cols) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col overflow-hidden">
            <section className="h-full min-h-0 p-5 sm:p-6 rounded-xl bg-white border border-[#cad7cc] shadow-sm overflow-hidden flex flex-col">
              <DashboardLeaderboard
                activeStartup={activeStartup}
                activeLotLeaderboard={activeLotLeaderboard}
                recentBids={recentBids}
                overallLeaderboard={leaderboard}
              />
            </section>
          </div>
        </main>
      )}

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
