'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Trophy, Gavel, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface Props {
  startup: {
    id?: string;
    display_order?: number;
    name: string;
    sector: string;
    tagline?: string;
    founder_names?: string[];
    winner_team_name?: string | null;
    winning_bid_amount?: number | null;
    base_price?: number;
  } | null;
  onDismiss: () => void;
}

export function SoldOverlay({ startup, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Elegant celebratory confetti ribbons
  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `-${Math.random() * 20 + 5}%`,
        color: ['#1a5c3e', '#22704b', '#059669', '#10b981', '#f59e0b', '#d97706', '#cad7cc'][i % 7],
        delay: `${Math.random() * 1.8}s`,
        duration: `${2.2 + Math.random() * 2.2}s`,
        rotate: `rotate(${Math.random() * 360}deg)`,
        size: Math.random() > 0.5 ? 'w-3 h-3' : 'w-2 h-4',
      })),
    [startup?.name]
  );

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismissRef.current(), 400);
  };

  useEffect(() => {
    if (!startup) return;
    setVisible(true);

    const timer = setTimeout(() => {
      handleDismiss();
    }, 6500);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [startup]);

  if (!startup) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-500 backdrop-blur-md select-none cursor-pointer ${
        visible ? 'opacity-100 bg-[#203126]/50' : 'opacity-0 pointer-events-none bg-transparent'
      }`}
    >
      {/* Confetti Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {confettiParticles.map((p, i) => (
          <span
            key={i}
            className={`absolute ${p.size} rounded-xs animate-confetti opacity-90 shadow-xs`}
            style={{
              left: p.left,
              top: p.top,
              background: p.color,
              animationDelay: p.delay,
              animationDuration: p.duration,
              transform: p.rotate,
            }}
          />
        ))}
      </div>

      {/* ── PRESTIGIOUS CELEBRATION CARD ────────────────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex flex-col items-center text-center p-7 sm:p-10 lg:p-12 rounded-3xl bg-white border-2 border-[#1a5c3e]/30 shadow-[0_25px_60px_-15px_rgba(26,92,62,0.3)] max-w-xl w-full mx-auto space-y-6 animate-scale-in cursor-default"
      >
        {/* Quick Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full text-[#56695e] hover:text-[#203126] hover:bg-[#eff4f0] transition cursor-pointer"
          title="Dismiss (or press Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Prestigious Gold & Emerald Medallion Emblem */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-amber-50 to-amber-100/80 border-2 border-amber-300 shadow-md flex items-center justify-center text-amber-700 animate-bounce-once">
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 drop-shadow-xs" strokeWidth={1.75} />
          </div>
          <div className="absolute -bottom-2 px-3.5 py-1 rounded-full bg-[#1a5c3e] text-white text-[11px] font-mono font-bold tracking-widest uppercase shadow-sm border border-emerald-300/30 flex items-center gap-1.5">
            <Gavel className="w-3.5 h-3.5" />
            <span>GAVEL CLOSED</span>
          </div>
        </div>

        {/* Lot Meta & Startup Name */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-[#1a5c3e] uppercase tracking-wider">
            {startup.display_order && (
              <span>LOT #{String(startup.display_order).padStart(2, '0')}</span>
            )}
            {startup.display_order && <span>·</span>}
            <span className="px-2 py-0.5 rounded bg-[#1a5c3e]/10 border border-[#1a5c3e]/20">
              {startup.sector}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#203126] tracking-tight leading-tight pt-1">
            {startup.name}
          </h1>

          {startup.founder_names && startup.founder_names.length > 0 && (
            <p className="text-xs text-[#56695e] font-medium pt-0.5">
              Founders: <span className="text-[#203126] font-semibold">{startup.founder_names.join(', ')}</span>
            </p>
          )}
        </div>

        {/* Winning Investor Banner */}
        {startup.winner_team_name && (
          <div className="flex flex-col items-center gap-1.5 py-4 px-6 sm:px-8 rounded-2xl bg-gradient-to-b from-[#f0f5f1] to-[#e7efe9] border border-[#cad7cc] shadow-inner w-full">
            <span className="text-[#56695e] text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1a5c3e]" />
              SUCCESSFUL ACQUISITION BY
            </span>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1a5c3e] tracking-tight">
              {startup.winner_team_name}
            </span>
            <span className="text-[11px] font-medium text-[#56695e] tracking-normal">
              Official Investor Syndicate · Allocation Confirmed
            </span>
          </div>
        )}

        {/* Winning Valuation Display */}
        {startup.winning_bid_amount && (
          <div className="flex flex-col items-center gap-1 pt-1">
            <span className="text-xs font-mono uppercase tracking-widest text-[#56695e] font-semibold">
              Final Settled Valuation
            </span>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tabular-nums text-[#203126]">
              ₹{Number(startup.winning_bid_amount).toLocaleString('en-IN')}
            </span>
            {startup.base_price && startup.winning_bid_amount > startup.base_price && (
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +{Math.round(((startup.winning_bid_amount - startup.base_price) / startup.base_price) * 100)}% over reserve floor
              </span>
            )}
          </div>
        )}

        {/* Footer Progress & Dismiss Tip */}
        <div className="pt-2 w-full flex flex-col items-center gap-2">
          <div className="w-48 h-1.5 bg-[#eff4f0] rounded-full overflow-hidden border border-[#cad7cc]">
            <div
              className="h-full bg-[#1a5c3e] rounded-full"
              style={{ animation: 'shrink-bar 6.5s linear forwards' }}
            />
          </div>
          <span className="text-[11px] font-mono text-[#8a9a8f]">
            Advancing stage · Click anywhere or press Esc to dismiss
          </span>
        </div>
      </div>
    </div>
  );
}
