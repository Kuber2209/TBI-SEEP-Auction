'use client';

import React, { useState } from 'react';
import { Calculator, Percent, TrendingUp, Sparkles, HelpCircle } from 'lucide-react';

interface ValuationCalculatorProps {
  currentBidAmount: number;
  basePrice: number;
}

export function ValuationCalculator({
  currentBidAmount,
  basePrice,
}: ValuationCalculatorProps) {
  const [targetEquityPct, setTargetEquityPct] = useState<number>(10);
  const activeAmount = currentBidAmount > 0 ? currentBidAmount : basePrice;

  // Implied Post-Money Valuation = Investment / Equity%
  const impliedValuation = (activeAmount / (targetEquityPct / 100));
  const impliedPreMoney = impliedValuation - activeAmount;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-navy-950/70 border border-navy-800/90 shadow-inner space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-display font-bold uppercase tracking-wider text-white">
              Valuation & Equity Modeler
            </h4>
            <p className="text-[10px] text-slate-400">Real-time cap table & valuation estimator</p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-black text-gold-400 bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
          At ₹{activeAmount.toLocaleString('en-IN')} Offer
        </span>
      </div>

      {/* Target Equity Slider & Presets */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium">Assumed Equity Target:</span>
          <span className="font-mono font-black text-gold-400 text-sm">
            {targetEquityPct}% Stake
          </span>
        </div>

        <input
          type="range"
          min={2}
          max={25}
          step={0.5}
          value={targetEquityPct}
          onChange={(e) => setTargetEquityPct(Number(e.target.value))}
          className="w-full h-1.5 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
        />

        <div className="flex items-center justify-between gap-1.5 mt-2">
          {[5, 7.5, 10, 15, 20].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTargetEquityPct(preset)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition flex-1 ${
                targetEquityPct === preset
                  ? 'bg-gold-500 text-navy-950 shadow-gold'
                  : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      {/* Calculated Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-navy-800/80">
        <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-800">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">
            Implied Post-Money Valuation
          </span>
          <span className="font-display font-black text-sm sm:text-base text-white mt-0.5 block">
            ₹ {Math.round(impliedValuation).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-800">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">
            Implied Pre-Money Floor
          </span>
          <span className="font-display font-black text-sm sm:text-base text-emerald-400 mt-0.5 block">
            ₹ {Math.round(impliedPreMoney).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
