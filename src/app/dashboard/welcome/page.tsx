'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { DashboardWelcomeScreen } from '@/components/dashboard/DashboardWelcomeScreen';
import { DashboardStatBar } from '@/components/dashboard/DashboardStatBar';
import { DashboardTicker } from '@/components/dashboard/DashboardTicker';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

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

export default function DashboardWelcomePage() {
  const router = useRouter();
  const {
    session,
    startups,
    activeStartup,
    recentBids,
    stats,
    recentEvents,
    connectionStatus,
    lastSyncedAt,
  } = useDashboardSync();

  const clock = useClock();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden select-none bg-[#f0f5f1] text-[#203126]">
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
                Welcome Stage
              </span>
            </div>
            <p className="text-[11px] text-[#56695e] font-medium tracking-normal mt-0.5">
              BITS Pilani Hyderabad · Live Startup Auction
            </p>
          </div>
        </div>

        {/* View Switcher / Navigation to Live Stage */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="px-4 py-1.5 rounded-lg bg-[#1a5c3e] hover:bg-[#144931] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Open Live Auction Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {session && (
            <span className="text-[11px] font-mono text-[#56695e] hidden md:block uppercase tracking-wider font-semibold">
              {session.name}
            </span>
          )}
          <span className="text-sm font-mono text-[#203126] font-bold tabular-nums px-2.5 py-1 rounded-md bg-white border border-[#cad7cc] shadow-2xs">
            {clock}
          </span>
        </div>
      </header>

      {/* ── WELCOME CONTENT ──────────────────────────────────────────────────── */}
      <DashboardWelcomeScreen
        startups={startups}
        session={session}
        stats={stats}
        activeStartup={activeStartup}
        onEnterArena={() => router.push('/dashboard')}
      />

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
