'use client';

import React, { useState } from 'react';
import { logoutAction } from '@/lib/auth/actions';
import { Profile, SessionStatus } from '@/lib/supabase/types';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LogOut, Radio, Shield, Users, Briefcase, Menu, X } from 'lucide-react';

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#e5ece6] text-[#203126] border border-[#cad7cc]">
            EVENT CONCLUDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#e5ece6] text-[#56695e] border border-[#cad7cc]">
            LOBBY WAITING
          </span>
        );
    }
  };

  return (
    <header className="bg-[#eff4f0] sticky top-0 z-40 border-b border-[#cad7cc] px-4 sm:px-6 lg:px-8 py-2.5 transition-colors duration-150 shadow-[0_1px_3px_rgba(32,49,38,0.05)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Program Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            {/* Official TBI BITS Pilani Logo Badge */}
            <div className="h-9 sm:h-10 px-2 py-0.5 rounded-md bg-[#dfe7e0] border border-[#cad7cc] flex items-center justify-center shrink-0">
              <img
                src="/images/tbi-bits-logo.png"
                alt="Technology Business Incubator - BITS Pilani Hyderabad Campus"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-[#203126] text-base sm:text-lg">
                  SEEP <span className="text-[#1a5c3e]">4.0</span>
                </span>
                {isRehearsal && (
                  <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 rounded-md">
                    Rehearsal
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#56695e] font-medium tracking-wide">
                BITS Pilani Hyderabad · TBI
              </p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-[#cad7cc] mx-1" />
          <div className="hidden md:flex items-center gap-2">{getStatusBadge()}</div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {onlineCount !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs text-[#203126] shadow-sm">
              <Users className="w-3.5 h-3.5 text-[#1a5c3e]" strokeWidth={1.5} />
              <span>
                <strong className="text-[#203126] font-mono tabular-nums">{onlineCount}</strong> Online
              </span>
            </div>
          )}

          {profile?.role === 'bidder' && onOpenPortfolio && (
            <button
              onClick={onOpenPortfolio}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#1a5c3e] hover:bg-[#144931] border border-[#1a5c3e] text-xs font-semibold text-white transition-colors duration-150 shadow-sm active:scale-[0.98]"
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
            <div className="flex items-center gap-3 pl-3 border-l border-[#cad7cc]">
              <div className="text-right">
                <div className="text-xs font-semibold text-[#203126] flex items-center justify-end gap-1.5">
                  {profile.role === 'admin' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#1a5c3e]/10 text-[#1a5c3e] border border-[#1a5c3e]/20 rounded">
                      ADMIN
                    </span>
                  )}
                  {profile.team_name}
                </div>
                <div className="text-[10px] text-[#56695e] font-mono">
                  {profile.display_user_id}
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 rounded-md bg-[#e5ece6] hover:bg-rose-50 hover:text-[#d93838] border border-[#cad7cc] hover:border-rose-200 text-[#56695e] transition-colors duration-150 active:scale-[0.96]"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-[#203126]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-[#cad7cc] space-y-3">
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            {onlineCount !== undefined && (
              <span className="text-xs text-[#56695e] font-mono">
                {onlineCount} Online
              </span>
            )}
          </div>

          {profile && (
            <div className="flex items-center justify-between pt-2 border-t border-[#cad7cc]">
              <div>
                <span className="text-xs font-semibold text-[#203126] block">
                  {profile.team_name}
                </span>
                <span className="text-[10px] text-[#56695e] font-mono">
                  {profile.display_user_id} · {profile.role.toUpperCase()}
                </span>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200"
                >
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
