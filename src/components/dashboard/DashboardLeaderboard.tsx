'use client';

import React from 'react';
import { LeaderboardEntry } from '@/hooks/useDashboardSync';

interface Props {
  leaderboard: LeaderboardEntry[];
}

export function DashboardLeaderboard({ leaderboard }: Props) {
  const visible = leaderboard.slice(0, 10);
  const activeTeamsCount = leaderboard.filter((t) => t.lotsWon > 0).length;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#56695e]">
          Investor Leaderboard
        </span>
        <span className="text-xs font-mono text-[#8a9a8f]">
          {activeTeamsCount} team{activeTeamsCount !== 1 ? 's' : ''} deployed
        </span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5 flex-1">
        {visible.map((entry, idx) => {
          const isTop = idx === 0 && entry.lotsWon > 0;
          const hasWins = entry.lotsWon > 0;

          return (
            <div
              key={entry.teamId}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                isTop
                  ? 'bg-[#1a5c3e]/10 border border-[#1a5c3e]/30 shadow-2xs'
                  : hasWins
                  ? 'bg-white border border-[#cad7cc] shadow-2xs'
                  : 'bg-[#f9f8f6] border border-[#e2e5ea]'
              }`}
            >
              {/* Rank + Team Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    isTop
                      ? 'bg-[#1a5c3e] text-white shadow-xs'
                      : hasWins
                      ? 'bg-[#eff4f0] text-[#203126] border border-[#cad7cc]'
                      : 'text-[#8a9a8f]'
                  }`}
                >
                  {idx + 1}
                </span>
                <span
                  className={`text-sm truncate ${
                    isTop
                      ? 'font-bold text-[#1a5c3e]'
                      : hasWins
                      ? 'font-semibold text-[#203126]'
                      : 'text-[#56695e]'
                  }`}
                >
                  {entry.teamName}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0 ml-2">
                {entry.lotsWon > 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      isTop
                        ? 'bg-[#1a5c3e] text-white'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {entry.lotsWon} won
                  </span>
                )}
                <span
                  className={`text-xs font-mono font-bold tabular-nums ${
                    isTop
                      ? 'text-[#1a5c3e]'
                      : hasWins
                      ? 'text-[#203126]'
                      : 'text-[#8a9a8f]'
                  }`}
                >
                  {entry.capitalSpent > 0
                    ? `₹${Number(entry.capitalSpent).toLocaleString('en-IN')}`
                    : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
