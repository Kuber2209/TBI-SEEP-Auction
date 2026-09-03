'use client';

import React, { useState } from 'react';

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

  return (
    <div className="space-y-4 text-xs">
      {/* Tab Switcher (Quiet, un-boxed) */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('slider')}
            className={`font-medium transition-colors ${
              activeTab === 'slider'
                ? 'text-amber-700 dark:text-amber-400 border-b-2 border-amber-500 pb-1 -mb-[9px]'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Target Modeler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`font-medium transition-colors ${
              activeTab === 'matrix'
                ? 'text-amber-700 dark:text-amber-400 border-b-2 border-amber-500 pb-1 -mb-[9px]'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Increment Matrix
          </button>
        </div>

        <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
          Base: ₹{resolvedAmount.toLocaleString('en-IN')}
        </span>
      </div>

      {activeTab === 'slider' ? (
        <div className="space-y-3">
          {/* Equity Slider & Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span>Target Equity Stake</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">{targetEquityPct}%</span>
            </div>

            <input
              type="range"
              min={2}
              max={25}
              step={0.5}
              value={targetEquityPct}
              onChange={(e) => setTargetEquityPct(Number(e.target.value))}
              aria-label="Target Equity Percentage Slider"
              className="w-full h-1.5 bg-slate-200 dark:bg-navy-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            <div className="flex items-center gap-1.5 pt-1">
              {[5, 7.5, 10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetEquityPct(preset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    targetEquityPct === preset
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Key Output Metrics (Integrated, un-boxed) */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Implied Post-Money</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                ₹{Math.round(impliedPostMoney).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Implied Pre-Money</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums mt-0.5 block">
                ₹{Math.round(impliedPreMoney).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            <span>Cost per 1% equity: </span>
            <strong className="text-slate-700 dark:text-slate-300 font-mono">
              ₹{Math.round(costPerOnePercent).toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      ) : (
        /* Matrix View */
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {resolvedBidOptions.map((optAmount, idx) => {
              const optPostMoney = optAmount / equityDecimal;
              const isSelected = optAmount === resolvedAmount;

              return (
                <div
                  key={optAmount}
                  className={`p-2.5 rounded-lg border text-xs ${
                    isSelected
                      ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-500/10'
                      : 'border-slate-200/80 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                    Option {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums block mt-0.5">
                    ₹{optAmount.toLocaleString('en-IN')}
                  </span>
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-white/[0.04] text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="block text-[10px] text-slate-400">Post-Money:</span>
                    <span className="font-mono tabular-nums">
                      ₹{Math.round(optPostMoney).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
