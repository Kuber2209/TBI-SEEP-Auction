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
      Array.from({ length: 40 }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `-${Math.random() * 20 + 5}%`,
        color: ['#00ff88', '#00cc6a', '#ffffff', '#4ade80', '#86efac', '#fbbf24'][i % 6],
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ background: 'radial-gradient(ellipse at center, #001a0a 0%, #000e06 100%)' }}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {confettiParticles.map((p, i) => (
          <span
            key={i}
            className="absolute w-2 h-2 rounded-sm animate-confetti opacity-80"
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

      {/* Glow ring */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
        <div className="text-7xl animate-bounce-once">🏆</div>

        <div>
          <p className="text-[#00ff88] text-sm font-mono font-bold uppercase tracking-[0.3em] mb-3">
            Lot Sold — {startup.sector}
          </p>
          <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tight leading-tight">
            {startup.name}
          </h1>
        </div>

        {startup.winner_team_name && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/40 text-xs font-mono uppercase tracking-widest">
              Acquired by
            </span>
            <span className="text-4xl sm:text-5xl font-black text-[#00ff88] tracking-tight">
              {startup.winner_team_name}
            </span>
          </div>
        )}

        {startup.winning_bid_amount && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">
              Winning Bid
            </span>
            <span className="text-4xl font-black font-mono tabular-nums text-white">
              ₹{Number(startup.winning_bid_amount).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Auto-dismiss bar */}
        <div className="w-64 h-0.5 bg-white/10 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-[#00ff88] rounded-full"
            style={{ animation: 'shrink-bar 6s linear forwards' }}
          />
        </div>
      </div>
    </div>
  );
}
