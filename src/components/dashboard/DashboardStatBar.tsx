'use client';

import React from 'react';
import { DashboardStats } from '@/hooks/useDashboardSync';

interface Props {
  stats: DashboardStats;
  connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  lastSyncedAt: Date | null;
}

export function DashboardStatBar({ stats, connectionStatus, lastSyncedAt }: Props) {
  const progressPct =
    stats.totalLots > 0
      ? Math.round((stats.closedLots / stats.totalLots) * 100)
      : 0;

  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-white/[0.03] border-t border-white/10">
      {/* Connection indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={`w-2 h-2 rounded-full ${
            connectionStatus === 'CONNECTED'
              ? 'bg-[#00ff88] shadow-[0_0_6px_rgba(0,255,136,0.6)]'
              : connectionStatus === 'CONNECTING'
              ? 'bg-amber-400 animate-pulse'
              : 'bg-red-500'
          }`}
        />
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
          {connectionStatus === 'CONNECTED'
            ? 'Live'
            : connectionStatus === 'CONNECTING'
            ? 'Connecting…'
            : 'Offline'}
        </span>
      </div>

      <div className="w-px h-4 bg-white/10" />

      {/* Stats pills */}
      <div className="flex items-center gap-5 flex-1 overflow-hidden">
        <Stat label="Total Lots" value={String(stats.totalLots)} />
        <Stat label="Closed" value={String(stats.closedLots)} highlight={stats.closedLots > 0} />
        <Stat
          label="Capital Deployed"
          value={
            stats.totalCapitalDeployed > 0
              ? `₹${Number(stats.totalCapitalDeployed).toLocaleString('en-IN')}`
              : '₹0'
          }
          highlight={stats.totalCapitalDeployed > 0}
        />
        <Stat label="Investor Teams" value={String(stats.activeTeams)} />
      </div>

      {/* Progress bar */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#00ff88] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-white/30">{progressPct}%</span>
      </div>

      {/* Sync time */}
      {lastSyncedAt && (
        <span className="text-[10px] font-mono text-white/20 shrink-0 hidden lg:block">
          {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5 shrink-0">
      <span className={`text-sm font-bold font-mono tabular-nums ${highlight ? 'text-[#00ff88]' : 'text-white/60'}`}>
        {value}
      </span>
      <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest hidden sm:block">
        {label}
      </span>
    </div>
  );
}
