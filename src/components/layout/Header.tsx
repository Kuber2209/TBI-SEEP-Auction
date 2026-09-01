'use client';

import React from 'react';
import { logoutAction } from '@/lib/auth/actions';
import { Profile, SessionStatus } from '@/lib/supabase/types';
import { LogOut, Radio, Shield, Users, Briefcase } from 'lucide-react';

interface HeaderProps {
  profile: Profile | null;
  sessionStatus?: SessionStatus;
  isRehearsal?: boolean;
  onlineCount?: number;
  onOpenPortfolio?: () => void;
  wonCount?: number;
}

export function Header({
  profile,
  sessionStatus = 'DRAFT',
  isRehearsal = false,
  onlineCount,
  onOpenPortfolio,
  wonCount = 0,
}: HeaderProps) {
  const getStatusBadge = () => {
    switch (sessionStatus) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE AUCTION
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Radio className="w-3 h-3 animate-pulse" />
            AUCTION PAUSED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            EVENT COMPLETED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/40 text-slate-400 border border-slate-700">
            WAITING LOBBY
          </span>
        );
    }
  };

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-navy-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Program Badges */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-gold-600 via-gold-500 to-amber-300 flex items-center justify-center font-black text-navy-950 text-xl shadow-gold">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold tracking-tight text-white text-lg">
                  SEEP <span className="text-gold-500">4.0</span>
                </span>
                {isRehearsal && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
                    Rehearsal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                BITS Pilani Hyderabad · TBI
              </p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-navy-800" />
          <div className="hidden md:flex items-center gap-2">{getStatusBadge()}</div>
        </div>

        {/* User Info & Quick Actions */}
        <div className="flex items-center gap-3">
          {onlineCount !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-900 border border-navy-800 text-xs text-slate-300">
              <Users className="w-3.5 h-3.5 text-seep-sky" />
              <span>
                <strong className="text-white">{onlineCount}</strong> Online
              </span>
            </div>
          )}

          {profile?.role === 'bidder' && onOpenPortfolio && (
            <button
              onClick={onOpenPortfolio}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 border border-navy-700 text-xs font-semibold text-gold-400 transition"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Portfolio</span>
              {wonCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-gold-500 text-navy-950 text-[10px] font-bold flex items-center justify-center">
                  {wonCount}
                </span>
              )}
            </button>
          )}

          {profile && (
            <div className="flex items-center gap-2 pl-2 border-l border-navy-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
                  {profile.role === 'admin' && (
                    <Shield className="w-3 h-3 text-gold-500 inline" />
                  )}
                  {profile.team_name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {profile.display_user_id}
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sign Out"
                  className="p-2 rounded-lg bg-navy-900 hover:bg-rose-950/40 hover:text-rose-400 border border-navy-800 text-slate-400 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
