'use client';

import React from 'react';
import { LeaderboardEntry } from '@/hooks/useDashboardSync';

interface Props {
  leaderboard: LeaderboardEntry[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function DashboardLeaderboard({ leaderboard }: Props) {
  const visible = leaderboard.slice(0, 10);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">
          Investor Leaderboard
        </span>
        <span className="text-[10px] font-mono text-white/25">
          {leaderboard.filter((t) => t.lotsWon > 0).length} teams active
        </span>
      </div>

      <div className="flex flex-col gap-1.5 overflow-hidden">
        {visible.map((entry, idx) => {
          const medal = MEDALS[idx] || null;
          const isTop = idx === 0 && entry.lotsWon > 0;
          const hasWins = entry.lotsWon > 0;

          return (
            <div
              key={entry.teamId}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                isTop
                  ? 'bg-[#00ff88]/10 border border-[#00ff88]/30'
                  : hasWins
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-white/[0.02] border border-white/5'
              }`}
            >
              {/* Rank + Team Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm w-5 shrink-0 text-center">
                  {medal || (
                    <span className="text-[10px] font-mono text-white/25">
                      {idx + 1}
                    </span>
                  )}
                </span>
                <span
                  className={`text-sm font-bold truncate ${
                    isTop ? 'text-[#00ff88]' : hasWins ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {entry.teamName}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0 ml-2">
                {entry.lotsWon > 0 && (
                  <span className="text-[10px] font-mono text-[#00ff88]/70 font-semibold">
                    {entry.lotsWon} lot{entry.lotsWon !== 1 ? 's' : ''}
                  </span>
                )}
                <span
                  className={`text-xs font-mono font-bold tabular-nums ${
                    hasWins ? 'text-white/70' : 'text-white/20'
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
