'use client';

import React, { useState } from 'react';
import {
  Calculator,
  Sliders,
  Grid,
  TrendingUp,
  Percent,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  DollarSign,
  Info,
} from 'lucide-react';

export interface ValuationCalculatorProps {
  currentBidAmount?: number;
  activeAmount?: number;
  basePrice?: number;
  bidOptions?: number[];
  currentHighestBid?: number | null;
}

export function ValuationCalculator({
  currentBidAmount,
  activeAmount,
  basePrice = 10000,
  bidOptions = [],
  currentHighestBid,
}: ValuationCalculatorProps) {
  const [activeTab, setActiveTab] = useState<'slider' | 'matrix'>('slider');
  const [targetEquityPct, setTargetEquityPct] = useState<number>(10);

  // Determine active offer amount
  const resolvedAmount =
    activeAmount !== undefined && activeAmount > 0
      ? activeAmount
      : currentBidAmount !== undefined && currentBidAmount > 0
      ? currentBidAmount
      : currentHighestBid !== undefined && currentHighestBid !== null && currentHighestBid > 0
      ? currentHighestBid
      : basePrice > 0
      ? basePrice
      : 10000;

  // Resolve dynamic bid options for matrix
  const resolvedBidOptions: number[] =
    bidOptions && bidOptions.length > 0
      ? bidOptions
      : [
          resolvedAmount,
          resolvedAmount + 2500,
          resolvedAmount + 5000,
          resolvedAmount + 10000,
        ];

  // Implied calculations for active offer
  const equityDecimal = Math.max(0.001, targetEquityPct / 100);
  const impliedPostMoney = resolvedAmount / equityDecimal;
  const impliedPreMoney = Math.max(0, impliedPostMoney - resolvedAmount);
  const costPerOnePercent = resolvedAmount / targetEquityPct;

  // Anchor valuation for comparative ownership calculation (base valuation floor)
  const anchorValuation = Math.max(1, (basePrice || 10000) / 0.1);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-navy-950/80 border border-navy-800/90 shadow-xl space-y-4">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-navy-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-white">
              Valuation & Equity Modeler
            </h4>
            <p className="text-[10px] text-slate-400">
              Interactive financial intelligence & cap table scenario modeler
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-navy-900/90 p-1 rounded-xl border border-navy-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('slider')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'slider'
                ? 'bg-gold-500 text-navy-950 shadow-gold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Target Modeler</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'matrix'
                ? 'bg-gold-500 text-navy-950 shadow-gold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>Increment Matrix</span>
          </button>
        </div>
      </div>

      {/* Mode A: Target Equity Modeler */}
      {activeTab === 'slider' && (
        <div className="space-y-4 animate-fade-in">
          {/* Active Offer Banner */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-navy-900/70 border border-navy-800 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              Active Modeling Base:
            </span>
            <span className="font-mono font-black text-gold-400 bg-navy-950 px-2.5 py-0.5 rounded-lg border border-gold-500/20">
              ₹{resolvedAmount.toLocaleString('en-IN')} Offer
            </span>
          </div>

          {/* Slider & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Target Equity Allocation:</span>
              <span className="font-mono font-black text-gold-400 text-sm bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/30">
                {targetEquityPct}% Equity
              </span>
            </div>

            <input
              type="range"
              min={2}
              max={25}
              step={0.5}
              value={targetEquityPct}
              onChange={(e) => setTargetEquityPct(Number(e.target.value))}
              aria-label="Target Equity Percentage Slider"
              className="w-full h-2 bg-navy-900 rounded-lg appearance-none cursor-pointer accent-gold-500 border border-navy-800"
            />

            {/* Quick Presets */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {[5, 7.5, 10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetEquityPct(preset)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition flex-1 ${
                    targetEquityPct === preset
                      ? 'bg-gold-500 text-navy-950 shadow-gold'
                      : 'bg-navy-900/90 text-slate-400 hover:text-white hover:bg-navy-850 border border-navy-800'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Calculated Output Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-navy-900/90 border border-navy-800 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Implied Post-Money Valuation
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
              </div>
              <span className="font-display font-black text-lg sm:text-xl text-white block">
                ₹ {Math.round(impliedPostMoney).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Total enterprise value implied at {targetEquityPct}% equity
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-900/90 border border-navy-800 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Implied Pre-Money Floor
                </span>
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="font-display font-black text-lg sm:text-xl text-emerald-400 block">
                ₹ {Math.round(impliedPreMoney).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Pre-money cap = Post-Money − ₹{resolvedAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Cost Per 1% Equity Callout */}
          <div className="p-2.5 rounded-xl bg-navy-900/50 border border-navy-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-seep-sky" />
              Cost Per 1% Equity Stake:
            </span>
            <span className="font-mono font-bold text-slate-200">
              ₹{Math.round(costPerOnePercent).toLocaleString('en-IN')} / 1%
            </span>
          </div>
        </div>
      )}

      {/* Mode B: Multi-Increment Valuation Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">
              Comparing 4 Dynamic Increments @ <strong className="text-gold-400 font-mono">{targetEquityPct}% Target</strong>:
            </span>
            <div className="flex items-center gap-1">
              {[5, 10, 15, 20].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTargetEquityPct(p)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                    targetEquityPct === p
                      ? 'bg-gold-500 text-navy-950'
                      : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Comparative Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {resolvedBidOptions.map((optAmount, idx) => {
              const optPostMoney = optAmount / equityDecimal;
              const optPreMoney = Math.max(0, optPostMoney - optAmount);
              const optImpliedStakeAtBase = Math.min(
                100,
                (optAmount / anchorValuation) * 100
              );
              const isSelected = optAmount === resolvedAmount;

              return (
                <div
                  key={optAmount}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-gold-500/10 border-gold-500/50 shadow-gold'
                      : 'bg-navy-900/80 border-navy-800 hover:border-navy-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-navy-950 text-gold-400 border border-navy-800">
                        Option #{idx + 1}
                      </span>
                      {isSelected && (
                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-gold-500 text-navy-950">
                          Active
                        </span>
                      )}
                    </div>

                    <span className="text-xs sm:text-sm font-display font-black text-white block">
                      ₹{optAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-navy-800/80 space-y-1 text-[10px]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Post-Money</span>
                      <span className="font-mono font-bold text-slate-200">
                        ₹{Math.round(optPostMoney).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Pre-Money</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{Math.round(optPreMoney).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Base Share</span>
                      <span className="font-mono font-bold text-seep-sky">
                        {optImpliedStakeAtBase.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 italic text-center pt-1">
            Calculated across live auction increment increments based on current round bidding velocity.
          </p>
        </div>
      )}
    </div>
  );
}
