'use client';

import React, { useState, useEffect } from 'react';
import { BidderWallet, Profile, Startup } from '@/lib/supabase/types';
import { Activity, ShieldAlert, Download, Wifi, WifiOff, Users, Server, FileJson } from 'lucide-react';

interface RoomTelemetryDashboardProps {
  bidders: (Profile & { wallet?: BidderWallet })[];
  startups: Startup[];
  isUserOnline: (userId: string) => boolean;
  onRefresh?: () => void;
}

export function RoomTelemetryDashboard({
  bidders,
  startups,
  isUserOnline,
  onRefresh,
}: RoomTelemetryDashboardProps) {
  const [latencyMs, setLatencyMs] = useState<number>(42);
  const [isExporting, setIsExporting] = useState(false);

  // Measure round-trip ping time
  useEffect(() => {
    const measurePing = async () => {
      const start = performance.now();
      try {
        await fetch('/api/auction/sync', { method: 'HEAD', cache: 'no-store' });
        const elapsed = Math.round(performance.now() - start);
        setLatencyMs(elapsed);
      } catch (e) {
        setLatencyMs(-1);
      }
    };

    measurePing();
    const interval = setInterval(measurePing, 8000);
    return () => clearInterval(interval);
  }, []);

  const totalPurse = bidders.reduce((sum, b) => sum + Number(b.wallet?.initial_balance || 50000), 0);
  const totalDeployed = bidders.reduce((sum, b) => sum + Number(b.wallet?.total_spent || 0), 0);
  const totalLocked = bidders.reduce((sum, b) => sum + Number(b.wallet?.locked_balance || 0), 0);
  const onlineBiddersCount = bidders.filter((b) => isUserOnline(b.id)).length;

  const handleDownloadSnapshot = () => {
    window.open('/api/admin/snapshot', '_blank');
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 border border-navy-800/80 shadow-2xl space-y-6">
      {/* Top Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-white uppercase tracking-wider">
              Room Telemetry & Risk Monitor
            </h3>
            <p className="text-xs text-slate-400">Real-time venue connectivity & liquidity distribution</p>
          </div>
        </div>

        <button
          onClick={handleDownloadSnapshot}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-xs font-bold text-slate-200 border border-navy-700 hover:border-gold-500/50 shadow-sm transition active:scale-95"
        >
          <FileJson className="w-4 h-4 text-gold-400" />
          <span>Export State Snapshot (.json)</span>
        </button>
      </div>

      {/* Connection & Network Health Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Latency Monitor */}
        <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Round-Trip Latency
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-display font-black text-xl text-white font-mono">
                {latencyMs >= 0 ? `${latencyMs} ms` : 'Disconnected'}
              </span>
            </div>
          </div>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              latencyMs >= 0 && latencyMs < 100
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {latencyMs >= 0 ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
        </div>

        {/* Active Bidders Online */}
        <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Online Attendance
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-display font-black text-xl text-white font-mono">
                {onlineBiddersCount} / {bidders.length || 15}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-seep-sky/15 text-seep-sky border border-seep-sky/30 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Total Capital Committed */}
        <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Capital Deployed
            </span>
            <span className="font-display font-black text-xl text-seep-sky mt-1 block">
              ₹ {totalDeployed.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-seep-sky/15 text-seep-sky border border-seep-sky/30 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
        </div>

        {/* Capital In Escrow */}
        <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Active In Escrow
            </span>
            <span className="font-display font-black text-xl text-amber-400 mt-1 block">
              ₹ {totalLocked.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Real-time Team Liquidity Distribution Heatmap */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
          15-Team Liquidity & Allocation Distribution
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bidders.map((b) => {
            const initial = Number(b.wallet?.initial_balance || 50000);
            const available = Number(b.wallet?.available_balance || 0);
            const spent = Number(b.wallet?.total_spent || 0);
            const locked = Number(b.wallet?.locked_balance || 0);
            const isOnline = isUserOnline(b.id);

            const spentPct = (spent / (initial || 1)) * 100;
            const lockedPct = (locked / (initial || 1)) * 100;

            return (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-navy-950/60 border border-navy-800/90 space-y-2 hover:border-navy-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                    <span className="font-bold text-xs text-white line-clamp-1">
                      {b.team_name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {b.display_user_id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Avail: ₹{available.toLocaleString('en-IN')}</span>
                  <span className="text-seep-sky font-bold">Spent: ₹{spent.toLocaleString('en-IN')}</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-navy-900 rounded-full overflow-hidden flex border border-navy-800">
                  <div style={{ width: `${spentPct}%` }} className="bg-seep-sky" />
                  <div style={{ width: `${lockedPct}%` }} className="bg-amber-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
