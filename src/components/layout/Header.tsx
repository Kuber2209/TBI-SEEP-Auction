'use client';

import React, { useState } from 'react';
import { logoutAction } from '@/lib/auth/actions';
import { Profile, SessionStatus } from '@/lib/supabase/types';
import { LogOut, Radio, Shield, Users, Briefcase, Menu, X, Sparkles, Building2 } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getStatusBadge = () => {
    switch (sessionStatus) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE AUCTION
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            AUCTION PAUSED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            EVENT CONCLUDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800/60 text-slate-400 border border-slate-700">
            LOBBY WAITING
          </span>
        );
    }
  };

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-white/[0.07] px-4 sm:px-6 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Program Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-navy-850 border border-white/[0.07] flex items-center justify-center text-gold-500 shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-white text-lg sm:text-xl">
                  SEEP <span className="text-gold-500">4.0</span>
                </span>
                {isRehearsal && (
                  <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-[6px]">
                    Rehearsal
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                BITS Pilani Hyderabad · TBI
              </p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-navy-800/80 mx-1" />
          <div className="hidden md:flex items-center gap-2">{getStatusBadge()}</div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {onlineCount !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-navy-900 border border-white/[0.07] text-xs text-slate-300 shadow-sm">
              <Users className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
              <span>
                <strong className="text-white font-mono tabular-nums">{onlineCount}</strong> Online
              </span>
            </div>
          )}

          {profile?.role === 'bidder' && onOpenPortfolio && (
            <button
              onClick={onOpenPortfolio}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-[12px] bg-navy-850 hover:bg-navy-800 border border-white/[0.07] hover:border-gold-500/30 text-xs font-semibold text-gold-400 transition-colors duration-150 shadow-sm active:scale-[0.98]"
            >
              <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Portfolio</span>
              {wonCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-gold-500 text-navy-950 text-[10px] font-bold flex items-center justify-center">
                  {wonCount}
                </span>
              )}
            </button>
          )}

          {profile && (
            <div className="flex items-center gap-3 pl-3 border-l border-white/[0.07]">
              <div className="text-right">
                <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                  {profile.role === 'admin' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20 rounded-[4px]">
                      ADMIN
                    </span>
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
                  className="p-2 rounded-[12px] bg-navy-900 hover:bg-rose-950/20 hover:text-rose-400 border border-white/[0.07] hover:border-rose-500/30 text-slate-400 transition-colors duration-150 active:scale-[0.98]"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {profile?.role === 'bidder' && onOpenPortfolio && (
            <button
              onClick={onOpenPortfolio}
              className="p-2 rounded-[12px] bg-navy-850 border border-navy-700 text-gold-400 text-xs font-bold flex items-center gap-1"
            >
              <Briefcase className="w-4 h-4" />
              {wonCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-gold-500 text-navy-950 text-[10px] font-black flex items-center justify-center">
                  {wonCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-[12px] bg-navy-900 border border-white/[0.07] text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-white/[0.07] space-y-3 pb-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>
            {onlineCount !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5 text-seep-sky" />
                <span>{onlineCount} Online</span>
              </div>
            )}
          </div>

          {profile && (
            <div className="p-3 rounded-[12px] bg-navy-900 border border-white/[0.07] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
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
                  className="px-3 py-1.5 rounded-lg bg-rose-950/50 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
