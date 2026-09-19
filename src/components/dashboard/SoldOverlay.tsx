'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';

interface Props {
  startup: { name: string; sector: string; winner_team_name?: string | null; winning_bid_amount?: number | null } | null;
  onDismiss: () => void;
}

export function SoldOverlay({ startup, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  // Stable ref so timer never re-fires due to onDismiss reference changing
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  // Memoize confetti positions — computed once per overlay mount, not on every render
  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 45 }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `-${Math.random() * 20 + 5}%`,
        color: ['#1a5c3e', '#22704b', '#059669', '#10b981', '#ca8a04', '#cad7cc'][i % 6],
        delay: `${Math.random() * 1.5}s`,
        duration: `${2 + Math.random() * 2}s`,
        rotate: `rotate(${Math.random() * 360}deg)`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startup?.name] // regenerate only when a new lot is sold
  );

  useEffect(() => {
    if (!startup) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      // Use ref so this closure never captures a stale/changed onDismiss
      setTimeout(() => onDismissRef.current(), 600);
    }, 6000);
    return () => clearTimeout(t);
  }, [startup]); // ← removed onDismiss from deps intentionally; using ref instead

  if (!startup) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 backdrop-blur-md ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ background: 'rgba(240, 245, 241, 0.95)' }}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {confettiParticles.map((p, i) => (
          <span
            key={i}
            className="absolute w-2.5 h-2.5 rounded-xs animate-confetti opacity-90 shadow-2xs"
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

      {/* Central Prestigious Card */}
      <div className="relative z-10 flex flex-col items-center gap-5 text-center px-10 py-10 rounded-2xl bg-white border-2 border-[#1a5c3e]/30 shadow-2xl max-w-xl mx-4">
        <div className="text-6xl sm:text-7xl animate-bounce-once drop-shadow-sm">🏆</div>

        <div className="space-y-1">
          <p className="text-[#1a5c3e] text-xs sm:text-sm font-mono font-black uppercase tracking-[0.25em]">
            Lot Acquired · {startup.sector}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-[#203126] tracking-tight leading-tight">
            {startup.name}
          </h1>
        </div>

        {startup.winner_team_name && (
          <div className="flex flex-col items-center gap-1.5 py-3 px-6 rounded-xl bg-[#eff4f0] border border-[#cad7cc] w-full">
            <span className="text-[#56695e] text-xs font-mono uppercase tracking-wider font-semibold">
              Acquired by
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#1a5c3e] tracking-tight">
              {startup.winner_team_name}
            </span>
          </div>
        )}

        {startup.winning_bid_amount && (
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-[#56695e] text-xs font-mono uppercase tracking-wider font-semibold">
              Winning Valuation:
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#203126]">
              ₹{Number(startup.winning_bid_amount).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Auto-dismiss progress bar */}
        <div className="w-48 h-1 bg-[#eff4f0] rounded-full overflow-hidden border border-[#cad7cc] mt-2">
          <div
            className="h-full bg-[#1a5c3e] rounded-full"
            style={{ animation: 'shrink-bar 6s linear forwards' }}
          />
        </div>
      </div>
    </div>
  );
}
