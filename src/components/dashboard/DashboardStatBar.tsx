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
    <div className="flex items-center gap-6 px-6 py-2.5 bg-white border-t border-[#cad7cc] shadow-[0_-1px_3px_rgba(32,49,38,0.04)]">
      {/* Connection indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            connectionStatus === 'CONNECTED'
              ? 'bg-emerald-600 shadow-xs'
              : connectionStatus === 'CONNECTING'
              ? 'bg-amber-500 animate-pulse'
              : 'bg-red-500'
          }`}
        />
        <span className="text-xs font-mono text-[#56695e] uppercase tracking-wider font-bold">
          {connectionStatus === 'CONNECTED'
            ? 'Live Connected'
            : connectionStatus === 'CONNECTING'
            ? 'Connecting…'
            : 'Offline'}
        </span>
      </div>

      <div className="w-px h-4 bg-[#cad7cc]" />

      {/* Stats pills */}
      <div className="flex items-center gap-6 flex-1 overflow-hidden">
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
        <Stat label="Active Investor Teams" value={String(stats.activeTeams)} />
      </div>

      {/* Progress bar */}
      <div className="hidden sm:flex items-center gap-2.5 shrink-0">
        <div className="w-24 h-1.5 rounded-full bg-[#eff4f0] border border-[#cad7cc] overflow-hidden">
          <div
            className="h-full bg-[#1a5c3e] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-[#1a5c3e]">{progressPct}%</span>
      </div>

      {/* Sync time */}
      {lastSyncedAt && (
        <span className="text-xs font-mono text-[#8a9a8f] shrink-0 hidden lg:block">
          Updated {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 shrink-0">
      <span className={`text-sm sm:text-base font-bold font-mono tabular-nums ${highlight ? 'text-[#1a5c3e]' : 'text-[#203126]'}`}>
        {value}
      </span>
      <span className="text-[10px] sm:text-xs font-mono text-[#56695e] uppercase tracking-wider font-semibold hidden sm:block">
        {label}
      </span>
    </div>
  );
}
