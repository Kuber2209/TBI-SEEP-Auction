'use client';

import React, { useState } from 'react';
import { logoutAction } from '@/lib/auth/actions';
import { Profile, SessionStatus } from '@/lib/supabase/types';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LogOut, Radio, Shield, Users, Briefcase, Menu, X, Building2 } from 'lucide-react';

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE AUCTION
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Radio className="w-3.5 h-3.5 animate-pulse" strokeWidth={1.5} />
            AUCTION PAUSED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            EVENT CONCLUDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            LOBBY WAITING
          </span>
        );
    }
  };

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-slate-200 dark:border-white/[0.07] px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-150">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Program Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-amber-500/15 dark:bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-gold-400 shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-slate-900 dark:text-white text-lg sm:text-xl">
                  SEEP <span className="text-amber-600 dark:text-gold-500">4.0</span>
                </span>
                {isRehearsal && (
                  <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 rounded-[6px]">
                    Rehearsal
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
                BITS Pilani Hyderabad · TBI
              </p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-navy-800/80 mx-1" />
          <div className="hidden md:flex items-center gap-2">{getStatusBadge()}</div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {onlineCount !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-white/[0.07] text-xs text-slate-600 dark:text-slate-300 shadow-sm">
              <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
              <span>
                <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{onlineCount}</strong> Online
              </span>
            </div>
          )}

          {profile?.role === 'bidder' && onOpenPortfolio && (
            <button
              onClick={onOpenPortfolio}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-[12px] bg-slate-100 hover:bg-slate-200 dark:bg-navy-850 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/[0.07] text-xs font-semibold text-amber-700 dark:text-gold-400 transition-colors duration-150 shadow-sm active:scale-[0.98]"
            >
              <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Portfolio</span>
              {wonCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white dark:bg-gold-500 dark:text-navy-950 text-[10px] font-bold flex items-center justify-center">
                  {wonCount}
                </span>
              )}
            </button>
          )}

          {/* Theme Switcher */}
          <ThemeToggle />

          {profile && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/[0.07]">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-end gap-1.5">
                  {profile.role === 'admin' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-gold-400 border border-amber-500/20 rounded-[4px]">
                      ADMIN
                    </span>
                  )}
                  {profile.team_name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {profile.display_user_id}
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 rounded-[10px] bg-slate-100 hover:bg-rose-50 dark:bg-navy-900 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-white/[0.07] hover:border-rose-300 dark:hover:border-rose-500/30 text-slate-500 dark:text-slate-400 transition-colors duration-150 active:scale-[0.96]"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle size="sm" />

          {profile?.role === 'bidder' && onOpenPortfolio && (
            <button
              onClick={onOpenPortfolio}
              className="p-2 rounded-[10px] bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-700 text-amber-700 dark:text-gold-400 text-xs font-bold flex items-center gap-1"
            >
              <Briefcase className="w-4 h-4" strokeWidth={1.5} />
              {wonCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 dark:bg-gold-500 text-white dark:text-navy-950 text-[10px] font-bold flex items-center justify-center">
                  {wonCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open menu"
            className="p-2 rounded-[10px] bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-white/[0.07] text-slate-600 dark:text-slate-300 active:scale-[0.96]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-200 dark:border-white/[0.07] space-y-3 pb-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>
            {onlineCount !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Users className="w-3.5 h-3.5 text-blue-500 dark:text-seep-sky" strokeWidth={1.5} />
                <span>{onlineCount} Online</span>
              </div>
            )}
          </div>

          {profile && (
            <div className="p-3 rounded-[12px] bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-white/[0.07] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {profile.role === 'admin' && (
                    <Shield className="w-3 h-3 text-amber-500 dark:text-gold-500 inline" strokeWidth={1.5} />
                  )}
                  {profile.team_name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {profile.display_user_id}
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 active:scale-[0.96]"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
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
