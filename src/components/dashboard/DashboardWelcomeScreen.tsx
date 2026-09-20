'use client';

import React, { useState } from 'react';
import { Startup, AuctionSession } from '@/lib/supabase/types';
import { DashboardStats } from '@/hooks/useDashboardSync';
import {
  Building2,
  Coins,
  Gavel,
  ShieldCheck,
  Users,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  TrendingUp,
  X,
} from 'lucide-react';

interface DashboardWelcomeScreenProps {
  startups: Startup[];
  session: AuctionSession | null;
  stats: DashboardStats;
  activeStartup: Startup | null;
  onEnterArena?: () => void;
}

export function DashboardWelcomeScreen({
  startups,
  session,
  stats,
  activeStartup,
  onEnterArena,
}: DashboardWelcomeScreenProps) {
  const [inspectStartup, setInspectStartup] = useState<Startup | null>(null);

  const initialPurse = session?.initial_purse_amount || 100000;
  const totalLots = startups.length || stats.totalLots || 14;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* ── HERO BANNER ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 sm:p-8 lg:p-10 bg-white border border-[#cad7cc] shadow-sm relative overflow-hidden">
        {/* Subtle decorative background watermarks */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#1a5c3e]/5 pointer-events-none blur-2xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="max-w-3xl space-y-4">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="px-3 py-1 rounded-md bg-[#1a5c3e]/10 text-[#1a5c3e] font-bold border border-[#1a5c3e]/20 uppercase tracking-wider">
                SEEP 4.0 Grand Finale
              </span>
              <span className="text-[#cad7cc]">·</span>
              <span className="text-[#56695e] font-semibold">
                Technology Business Incubator · BITS Pilani Hyderabad
              </span>
              <span className="text-[#cad7cc]">·</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Auditorium Stage Display
              </span>
            </div>

            {/* Main Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#203126] tracking-tight leading-tight">
                Student Entrepreneurship Encouragement Program
              </h1>
              <p className="text-lg sm:text-xl font-medium text-[#1a5c3e] mt-1.5">
                Live Venture Auction & Seed Capital Allocation
              </p>
            </div>

            <p className="text-sm sm:text-base text-[#56695e] leading-relaxed max-w-2xl font-normal">
              Welcome founders, esteemed faculty mentors, angel syndicates, and investor delegations. 
              Today, <strong className="text-[#203126] font-semibold">{totalLots} venture lots</strong> will 
              take the live gavel stage to raise strategic seed deployment from authorized syndicates.
            </p>

            {/* Live Arena Callout / Action button */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              {activeStartup ? (
                <button
                  onClick={onEnterArena}
                  className="px-6 py-3 rounded-lg bg-[#1a5c3e] hover:bg-[#144931] active:scale-[0.98] text-white font-bold text-sm flex items-center gap-2.5 shadow-md transition cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                  <span>Go to Bidding Page · Lot #{activeStartup.display_order}: {activeStartup.name}</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  onClick={onEnterArena}
                  className="px-6 py-3 rounded-lg bg-[#1a5c3e] hover:bg-[#144931] active:scale-[0.98] text-white font-bold text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <span>Go to Bidding Page</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              )}

              <span className="text-xs font-mono text-[#56695e]">
                {activeStartup
                  ? `Stage status: ${activeStartup.status.replace(/_/g, ' ')}`
                  : 'Stage operator preparing Lot #01'}
              </span>
            </div>
          </div>

          {/* Official TBI BITS Pilani Logo Plaque */}
          <div className="p-6 rounded-2xl bg-[#eff4f0] border border-[#cad7cc] shadow-xs flex flex-col items-center justify-center shrink-0 self-start lg:self-center gap-2">
            <img
              src="/images/tbi-bits-logo.png"
              alt="Technology Business Incubator - BITS Pilani Hyderabad Campus"
              className="h-20 sm:h-24 w-auto object-contain"
            />
            <span className="text-[11px] font-bold text-[#56695e] tracking-wider uppercase">
              Host Incubator
            </span>
          </div>
        </div>
      </div>

      {/* ── KEY AUCTION ECONOMICS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#cad7cc] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 flex items-center justify-center shrink-0 text-[#1a5c3e]">
            <Coins className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-[#56695e] font-semibold uppercase tracking-wider">Syndicate Purse</p>
            <p className="text-xl sm:text-2xl font-black text-[#203126] font-mono tabular-nums">
              ₹{Number(initialPurse).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#56695e]">Funded escrow per team</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#cad7cc] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800">
            <TrendingUp className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-[#56695e] font-semibold uppercase tracking-wider">Base Reserve Floor</p>
            <p className="text-xl sm:text-2xl font-black text-[#203126] font-mono tabular-nums">
              ₹5,000
            </p>
            <p className="text-[11px] text-[#56695e]">Minimum opening bid</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#cad7cc] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#eff4f0] border border-[#cad7cc] flex items-center justify-center shrink-0 text-[#203126]">
            <Building2 className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-[#56695e] font-semibold uppercase tracking-wider">Venture Lots</p>
            <p className="text-xl sm:text-2xl font-black text-[#203126] font-mono tabular-nums">
              {totalLots} Startups
            </p>
            <p className="text-[11px] text-[#56695e]">Diverse high-growth sectors</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#cad7cc] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 flex items-center justify-center shrink-0 text-[#1a5c3e]">
            <ShieldCheck className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-[#56695e] font-semibold uppercase tracking-wider">Auction Engine</p>
            <p className="text-xl sm:text-2xl font-black text-[#203126] font-mono">
              Live Escrow
            </p>
            <p className="text-[11px] text-[#56695e]">Sub-sec atomic resolution</p>
          </div>
        </div>
      </div>

      {/* ── VENTURE DEAL FLOW SCHEDULE ────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 sm:p-8 bg-white border border-[#cad7cc] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#cad7cc]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#203126]">
              Venture Deal Flow Showcase
            </h2>
            <p className="text-xs sm:text-sm text-[#56695e] mt-0.5">
              Scheduled student startup pitches and opening valuations for SEEP 4.0
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#56695e]">
            <span className="px-2.5 py-1 rounded-md bg-[#eff4f0] border border-[#cad7cc] font-semibold">
              {startups.length} Lots Scheduled
            </span>
          </div>
        </div>

        {/* Startups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {startups.map((s) => {
            const isLive = activeStartup?.id === s.id;
            const isSold = s.status === 'SOLD';
            const isPassed = s.status === 'UNSOLD';

            return (
              <div
                key={s.id}
                onClick={() => setInspectStartup(s)}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                  isLive
                    ? 'bg-[#1a5c3e]/5 border-[#1a5c3e] ring-2 ring-[#1a5c3e]/20'
                    : isSold
                    ? 'bg-[#f7faf8] border-[#cad7cc]'
                    : 'bg-white border-[#cad7cc] hover:border-[#1a5c3e]/40'
                }`}
              >
                <div>
                  {/* Top meta */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-mono font-bold text-[#56695e]">
                      LOT #{String(s.display_order).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1a5c3e]/10 text-[#1a5c3e] border border-[#1a5c3e]/20">
                      {s.sector}
                    </span>
                  </div>

                  {/* Startup Name & Tagline */}
                  <h3 className="text-lg font-bold text-[#203126] tracking-tight group-hover:text-[#1a5c3e]">
                    {s.name}
                  </h3>
                  {s.tagline && (
                    <p className="text-xs text-[#56695e] line-clamp-2 mt-1 leading-relaxed">
                      {s.tagline}
                    </p>
                  )}

                  {/* Founders */}
                  {s.founder_names && s.founder_names.length > 0 && (
                    <p className="text-[11px] text-[#56695e] mt-3 truncate">
                      <span className="text-[#88998e] font-medium">Founders: </span>
                      <span className="font-semibold text-[#203126]">
                        {s.founder_names.join(', ')}
                      </span>
                    </p>
                  )}
                </div>

                {/* Bottom valuation & status */}
                <div className="mt-4 pt-3 border-t border-[#cad7cc] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#56695e] block uppercase font-medium">Reserve Floor</span>
                    <span className="text-sm font-bold font-mono text-[#203126] tabular-nums">
                      ₹{Number(s.base_price || 5000).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      LIVE ON STAGE
                    </span>
                  ) : isSold ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#1a5c3e]/10 text-[#1a5c3e] border border-[#1a5c3e]/30">
                      SOLD (₹{Number(s.winning_bid_amount || 0).toLocaleString('en-IN')})
                    </span>
                  ) : isPassed ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                      PASSED
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#56695e]">
                      Click to inspect
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STAGE RULES & PROCEDURES ─────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 sm:p-8 bg-white border border-[#cad7cc] shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[#203126] flex items-center gap-2">
          <Gavel className="w-5 h-5 text-[#1a5c3e]" />
          <span>Auction Rules & Protocol for Investor Syndicates</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm text-[#56695e] leading-relaxed">
          <div className="p-4 rounded-xl bg-[#eff4f0] border border-[#cad7cc] space-y-2">
            <h4 className="font-bold text-[#203126] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1a5c3e]" />
              1. Bidding Increments
            </h4>
            <p>
              Bids must meet or exceed the ₹5,000 opening reserve floor. Quick increments are configured at ₹1k, ₹2.5k, ₹5k, and ₹10k.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#eff4f0] border border-[#cad7cc] space-y-2">
            <h4 className="font-bold text-[#203126] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1a5c3e]" />
              2. Atomic Escrow Locking
            </h4>
            <p>
              Placing a high bid locks that sum in escrow. If another syndicate submits a higher bid, your purse funds are automatically unlocked in real time.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#eff4f0] border border-[#cad7cc] space-y-2">
            <h4 className="font-bold text-[#203126] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1a5c3e]" />
              3. Final Gavel Call
            </h4>
            <p>
              The auction master will issue 3 gavel warnings before calling &ldquo;SOLD&rdquo;. The highest registered bidder at settlement wins the equity lot.
            </p>
          </div>
        </div>
      </div>

      {/* ── MODAL INSPECT POPUP ──────────────────────────────────────────────── */}
      {inspectStartup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#cad7cc] shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 animate-scale-in">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-[#1a5c3e]">
                    LOT #{String(inspectStartup.display_order).padStart(2, '0')}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#eff4f0] text-[#56695e] border border-[#cad7cc] font-semibold">
                    {inspectStartup.sector}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-[#203126]">
                  {inspectStartup.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectStartup(null)}
                className="p-1.5 rounded-lg text-[#56695e] hover:bg-[#eff4f0] hover:text-[#203126] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectStartup.tagline && (
              <p className="text-sm font-medium text-[#1a5c3e] italic">
                &ldquo;{inspectStartup.tagline}&rdquo;
              </p>
            )}

            {inspectStartup.founder_names && inspectStartup.founder_names.length > 0 && (
              <div className="text-xs sm:text-sm">
                <span className="text-[#56695e] font-medium">Founding Team: </span>
                <span className="font-bold text-[#203126]">
                  {inspectStartup.founder_names.join(', ')}
                </span>
              </div>
            )}

            {inspectStartup.description && (
              <p className="text-xs sm:text-sm text-[#56695e] leading-relaxed bg-[#eff4f0] p-4 rounded-xl border border-[#cad7cc]">
                {inspectStartup.description}
              </p>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-[#cad7cc]">
              <div>
                <span className="text-[11px] text-[#56695e] block uppercase font-medium">Reserve Base Price</span>
                <span className="text-lg font-bold font-mono text-[#203126] tabular-nums">
                  ₹{Number(inspectStartup.base_price || 5000).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={() => setInspectStartup(null)}
                className="px-5 py-2 rounded-lg bg-[#1a5c3e] text-white font-bold text-xs sm:text-sm hover:bg-[#144931] transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
