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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            LIVE AUCTION
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Radio className="w-3.5 h-3.5 animate-pulse" strokeWidth={1.5} />
            AUCTION PAUSED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#f1f4f7] text-[#33404f] border border-[#e2e5ea]">
            EVENT CONCLUDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#f1f4f7] text-[#6b7a8d] border border-[#e2e5ea]">
            LOBBY WAITING
          </span>
        );
    }
  };

  return (
    <header className="bg-[#f9f8f6] sticky top-0 z-40 border-b border-[#e2e5ea] px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Program Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 flex items-center justify-center text-[#1a5c3e] shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-[#33404f] text-lg sm:text-xl">
                  SEEP <span className="text-[#1a5c3e]">4.0</span>
                </span>
                {isRehearsal && (
                  <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 rounded-md">
                    Rehearsal
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#6b7a8d] font-medium tracking-wide uppercase">
                BITS Pilani Hyderabad · TBI
              </p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-[#e2e5ea] mx-1" />
          <div className="hidden md:flex items-center gap-2">{getStatusBadge()}</div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {onlineCount !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#f1f4f7] border border-[#e2e5ea] text-xs text-[#33404f] shadow-sm">
              <Users className="w-3.5 h-3.5 text-[#1a5c3e]" strokeWidth={1.5} />
              <span>
                <strong className="text-[#33404f] font-mono tabular-nums">{onlineCount}</strong> Online
              </span>
            </div>
          )}

          {profile?.role === 'bidder' && onOpenPortfolio && (
            <button
              onClick={onOpenPortfolio}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] border border-[#1a5c3e] text-xs font-semibold text-white transition-colors duration-150 shadow-sm active:scale-[0.98]"
            >
              <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Portfolio</span>
              {wonCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#1a5c3e] text-[10px] font-bold flex items-center justify-center">
                  {wonCount}
                </span>
              )}
            </button>
          )}

          {/* Theme Switcher */}
          <ThemeToggle />

          {profile && (
            <div className="flex items-center gap-3 pl-3 border-l border-[#e2e5ea]">
              <div className="text-right">
                <div className="text-xs font-semibold text-[#33404f] flex items-center justify-end gap-1.5">
                  {profile.role === 'admin' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#1a5c3e]/10 text-[#1a5c3e] border border-[#1a5c3e]/20 rounded">
                      ADMIN
                    </span>
                  )}
                  {profile.team_name}
                </div>
                <div className="text-[10px] text-[#6b7a8d] font-mono">
                  {profile.display_user_id}
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 rounded-md bg-[#f9f8f6] hover:bg-rose-50 hover:text-[#f04040] border border-[#e2e5ea] hover:border-rose-200 text-[#6b7a8d] transition-colors duration-150 active:scale-[0.96]"
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
              className="p-2 rounded-md bg-[#1a5c3e] text-white text-xs font-bold flex items-center gap-1"
            >
              <Briefcase className="w-4 h-4" strokeWidth={1.5} />
              {wonCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#1a5c3e] text-[10px] font-bold flex items-center justify-center">
                  {wonCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open menu"
            className="p-2 rounded-md bg-[#f9f8f6] border border-[#e2e5ea] text-[#33404f] active:scale-[0.96]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-[#e2e5ea] space-y-3 pb-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>
            {onlineCount !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-[#6b7a8d]">
                <Users className="w-3.5 h-3.5 text-[#1a5c3e]" strokeWidth={1.5} />
                <span>{onlineCount} Online</span>
              </div>
            )}
          </div>

          {profile && (
            <div className="p-3 rounded-lg bg-[#f1f4f7] border border-[#e2e5ea] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#33404f] flex items-center gap-1.5">
                  {profile.role === 'admin' && (
                    <Shield className="w-3 h-3 text-[#1a5c3e] inline" strokeWidth={1.5} />
                  )}
                  {profile.team_name}
                </div>
                <div className="text-[10px] text-[#6b7a8d] font-mono">
                  {profile.display_user_id}
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 active:scale-[0.96]"
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
