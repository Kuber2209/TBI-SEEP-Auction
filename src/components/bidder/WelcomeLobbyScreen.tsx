'use client';

import React, { useState } from 'react';
import { Profile, Startup, BidderWallet } from '@/lib/supabase/types';
import {
  Building2,
  Wallet,
  Users2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Radio,
} from 'lucide-react';

interface WelcomeLobbyScreenProps {
  profile: Profile;
  startups: Startup[];
  wallet: BidderWallet | null;
  onlineCount: number;
  onEnterArena: () => void;
}

export function WelcomeLobbyScreen({
  profile,
  startups,
  wallet,
  onlineCount,
  onEnterArena,
}: WelcomeLobbyScreenProps) {
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(startups[0] || null);
  const startingPurse = Number(wallet?.initial_balance || 50000);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="rounded-xl p-6 sm:p-8 lg:p-10 bg-[#eff4f0] border border-[#cad7cc] shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-[#1a5c3e]/10 text-[#1a5c3e] font-semibold border border-[#1a5c3e]/20">
                SEEP 4.0 Grand Finale
              </span>
              <span className="text-[#cad7cc]">·</span>
              <span className="text-[#56695e] font-medium">
                BITS Pilani Hyderabad TBI
              </span>
              <span className="text-[#cad7cc]">·</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Lobby Standby ({onlineCount} {onlineCount === 1 ? 'Team' : 'Teams'} Connected)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#203126] tracking-tight text-balance">
              Welcome, {profile.team_name}
            </h1>

            <p className="text-sm sm:text-base text-[#56695e] leading-relaxed max-w-2xl text-pretty">
              You are authenticated as investor syndicate <strong className="font-mono text-[#203126]">{profile.display_user_id}</strong>.
              Your investment purse of <strong className="text-[#203126] font-mono">₹{startingPurse.toLocaleString('en-IN')}</strong> has been funded in escrow.
              The live auction will commence as soon as the stage operator presents Lot #01.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onEnterArena}
                className="px-5 py-2.5 rounded-md bg-[#1a5c3e] hover:bg-[#144931] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
              >
                <span>Preview Live Bidding Pad</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
              <span className="text-xs text-[#56695e]">
                Auto-advances when bidding opens on stage
              </span>
            </div>
          </div>

          {/* Official TBI BITS Pilani Logo Plaque */}
          <div className="p-4 rounded-xl bg-[#dfe7e0] border border-[#cad7cc] shadow-sm flex items-center justify-center shrink-0 self-start md:self-center">
            <img
              src="/images/tbi-bits-logo.png"
              alt="Technology Business Incubator - BITS Pilani Hyderabad Campus"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* 4 Core Auction Rules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#eff4f0] border border-[#cad7cc] shadow-sm space-y-1.5">
          <div className="w-8 h-8 rounded-md bg-[#e5ece6] text-[#1a5c3e] border border-[#cad7cc] flex items-center justify-center font-bold text-xs mb-2">
            1
          </div>
          <h3 className="text-sm font-semibold text-[#203126]">
            Ascending English Auction
          </h3>
          <p className="text-xs text-[#56695e] leading-relaxed">
            Each lot opens at its base reserve. Bids advance in increments of ₹1,000, ₹2,500, ₹5,000, or ₹10,000.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#eff4f0] border border-[#cad7cc] shadow-sm space-y-1.5">
          <div className="w-8 h-8 rounded-md bg-[#e5ece6] text-[#1a5c3e] border border-[#cad7cc] flex items-center justify-center font-bold text-xs mb-2">
            2
          </div>
          <h3 className="text-sm font-semibold text-[#203126]">
            Guaranteed Escrow Safety
          </h3>
          <p className="text-xs text-[#56695e] leading-relaxed">
            Your purse is locked in escrow while holding the lead. If another team outbids you, your funds are released instantly.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#eff4f0] border border-[#cad7cc] shadow-sm space-y-1.5">
          <div className="w-8 h-8 rounded-md bg-[#e5ece6] text-[#1a5c3e] border border-[#cad7cc] flex items-center justify-center font-bold text-xs mb-2">
            3
          </div>
          <h3 className="text-sm font-semibold text-[#203126]">
            Rapid Hotkey Bidding
          </h3>
          <p className="text-xs text-[#56695e] leading-relaxed">
            Use keyboard numbers <strong className="font-mono text-[#203126]">[1]</strong> to <strong className="font-mono text-[#203126]">[4]</strong> to place bids instantly. Hit <strong className="font-mono text-[#203126]">[Space]</strong> to pass.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#eff4f0] border border-[#cad7cc] shadow-sm space-y-1.5">
          <div className="w-8 h-8 rounded-md bg-[#e5ece6] text-[#1a5c3e] border border-[#cad7cc] flex items-center justify-center font-bold text-xs mb-2">
            4
          </div>
          <h3 className="text-sm font-semibold text-[#203126]">
            Portfolio Diversification
          </h3>
          <p className="text-xs text-[#56695e] leading-relaxed">
            Acquire multiple ventures across CleanTech, MedTech, AgriTech, FinTech, and DeepTech until your purse is deployed.
          </p>
        </div>
      </div>

      {/* 12 Scheduled Startups Deal Sheet Preview */}
      <div className="rounded-xl p-6 sm:p-7 bg-[#eff4f0] border border-[#cad7cc] shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#cad7cc]">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#203126]">
              Venture Deal Flow ({startups.length} Scheduled Lots)
            </h2>
            <p className="text-xs text-[#56695e]">
              Review founding teams and reserve floors prior to live gavel call
            </p>
          </div>
          <span className="text-xs font-mono text-[#56695e]">
            Click any lot to inspect details
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Lot Selector Grid */}
          <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
            {startups.map((s) => {
              const isSelected = selectedStartup?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStartup(s)}
                  className={`p-3 rounded-md border text-left transition-colors active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#1a5c3e]/10 border-[#1a5c3e]/40 text-[#203126]'
                      : 'bg-[#e5ece6] border-[#cad7cc] hover:bg-[#d8e3da] text-[#203126]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-[#56695e] mb-1">
                    <span className="font-mono font-medium">Lot #{s.display_order}</span>
                    <span className="font-medium text-[#1a5c3e]">{s.sector}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-[#203126] truncate">
                    {s.name}
                  </h4>
                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-[10px] text-[#56695e]">Floor:</span>
                    <span className="font-mono font-semibold text-[#203126] tabular-nums">
                      ₹{Number(s.base_price).toLocaleString('en-IN')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Selected Startup Briefing */}
          <div className="md:col-span-6 p-5 sm:p-6 rounded-lg bg-[#e5ece6] border border-[#cad7cc] flex flex-col justify-between">
            {selectedStartup ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#56695e]">
                  <span className="font-mono">Lot #{selectedStartup.display_order} of {startups.length}</span>
                  <span className="font-semibold text-[#1a5c3e]">{selectedStartup.sector}</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#203126]">
                    {selectedStartup.name}
                  </h3>
                  {selectedStartup.tagline && (
                    <p className="text-sm text-[#56695e] mt-1 italic">
                      &ldquo;{selectedStartup.tagline}&rdquo;
                    </p>
                  )}
                </div>

                {selectedStartup.founder_names && selectedStartup.founder_names.length > 0 && (
                  <div className="text-xs text-[#56695e]">
                    <span className="text-[#56695e] mr-1.5">Founders:</span>
                    <span className="text-[#203126] font-medium">
                      {selectedStartup.founder_names.join(', ')}
                    </span>
                  </div>
                )}

                {selectedStartup.description && (
                  <p className="text-xs sm:text-sm text-[#56695e] leading-relaxed">
                    {selectedStartup.description}
                  </p>
                )}

                <div className="mt-6 pt-3 border-t border-[#cad7cc] flex items-baseline justify-between">
                  <span className="text-xs text-[#56695e]">Opening Floor Reserve:</span>
                  <span className="font-semibold text-lg text-[#203126] font-mono tabular-nums">
                    ₹{Number(selectedStartup.base_price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-[#56695e]">Select a startup to view summary</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
