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
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[#e2e5ea] pb-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('slider')}
            className={`font-semibold transition-colors ${
              activeTab === 'slider'
                ? 'text-[#1a5c3e] border-b-2 border-[#1a5c3e] pb-1 -mb-[9px]'
                : 'text-[#6b7a8d] hover:text-[#33404f]'
            }`}
          >
            Target Modeler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`font-semibold transition-colors ${
              activeTab === 'matrix'
                ? 'text-[#1a5c3e] border-b-2 border-[#1a5c3e] pb-1 -mb-[9px]'
                : 'text-[#6b7a8d] hover:text-[#33404f]'
            }`}
          >
            Increment Matrix
          </button>
        </div>

        <span className="text-[#6b7a8d] font-mono text-[11px]">
          Base: ₹{resolvedAmount.toLocaleString('en-IN')}
        </span>
      </div>

      {activeTab === 'slider' ? (
        <div className="space-y-3">
          {/* Equity Slider & Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[#33404f] font-medium">
              <span>Target Equity Stake</span>
              <span className="text-[#1a5c3e] font-semibold">{targetEquityPct}%</span>
            </div>

            <input
              type="range"
              min={2}
              max={25}
              step={0.5}
              value={targetEquityPct}
              onChange={(e) => setTargetEquityPct(Number(e.target.value))}
              aria-label="Target Equity Percentage Slider"
              className="w-full h-1.5 bg-[#e2e5ea] rounded-lg appearance-none cursor-pointer accent-[#1a5c3e]"
            />

            <div className="flex items-center gap-1.5 pt-1">
              {[5, 7.5, 10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetEquityPct(preset)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition ${
                    targetEquityPct === preset
                      ? 'bg-[#1a5c3e] text-white font-semibold shadow-sm'
                      : 'bg-[#f1f4f7] border border-[#e2e5ea] text-[#6b7a8d] hover:text-[#33404f]'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Key Output Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#e2e5ea]">
            <div>
              <span className="text-[#6b7a8d] block font-medium">Implied Post-Money</span>
              <span className="text-sm font-semibold text-[#33404f] font-mono tabular-nums mt-0.5 block">
                ₹{Math.round(impliedPostMoney).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="text-[#6b7a8d] block font-medium">Implied Pre-Money</span>
              <span className="text-sm font-semibold text-[#33404f] font-mono tabular-nums mt-0.5 block">
                ₹{Math.round(impliedPreMoney).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-[#6b7a8d] pt-1">
            <span>Cost per 1% equity: </span>
            <strong className="text-[#33404f] font-mono font-semibold">
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
                  className={`p-2.5 rounded-md border text-xs ${
                    isSelected
                      ? 'border-[#1a5c3e] bg-[#1a5c3e]/10 text-[#33404f]'
                      : 'border-[#e2e5ea] bg-[#f1f4f7] text-[#33404f]'
                  }`}
                >
                  <span className="text-[10px] text-[#6b7a8d] font-mono block">
                    Option {idx + 1}
                  </span>
                  <span className="font-semibold text-[#33404f] font-mono tabular-nums block mt-0.5">
                    ₹{optAmount.toLocaleString('en-IN')}
                  </span>
                  <div className="mt-2 pt-1.5 border-t border-[#e2e5ea] text-[11px] text-[#6b7a8d]">
                    <span className="block text-[10px] text-[#6b7a8d]">Post-Money:</span>
                    <span className="font-mono tabular-nums font-semibold text-[#33404f]">
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
