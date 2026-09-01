'use client';

import React from 'react';
import { BidderWallet } from '@/lib/supabase/types';
import { Wallet, Lock, CheckCircle, PieChart } from 'lucide-react';

interface WalletSummaryBarProps {
  wallet: BidderWallet | null;
}

export function WalletSummaryBar({ wallet }: WalletSummaryBarProps) {
  const initial = Number(wallet?.initial_balance || 0);
  const available = Number(wallet?.available_balance || 0);
  const locked = Number(wallet?.locked_balance || 0);
  const spent = Number(wallet?.total_spent || 0);

  return (
    <div className="glass-panel border-t border-navy-800 px-4 lg:px-8 py-3.5 shadow-2xl">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6 items-center">
        {/* Available Balance */}
        <div className="flex items-center gap-3 bg-navy-900/80 rounded-xl p-2.5 lg:p-3 border border-emerald-500/30">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-emerald-400 block">
              Available Purse
            </span>
            <span className="font-mono text-base lg:text-xl font-black text-white">
              ₹ {available.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Locked / Escrow Funds */}
        <div className="flex items-center gap-3 bg-navy-900/80 rounded-xl p-2.5 lg:p-3 border border-amber-500/30">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-amber-400 block">
              In Active Escrow
            </span>
            <span className="font-mono text-base lg:text-xl font-black text-white">
              ₹ {locked.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="flex items-center gap-3 bg-navy-900/80 rounded-xl p-2.5 lg:p-3 border border-seep-sky/30">
          <div className="w-10 h-10 rounded-lg bg-seep-sky/15 border border-seep-sky/30 flex items-center justify-center text-seep-sky shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-seep-sky block">
              Total Invested
            </span>
            <span className="font-mono text-base lg:text-xl font-black text-white">
              ₹ {spent.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Initial Allocation */}
        <div className="flex items-center gap-3 bg-navy-900/60 rounded-xl p-2.5 lg:p-3 border border-navy-800">
          <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center text-slate-400 shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Starting Purse
            </span>
            <span className="font-mono text-base lg:text-xl font-bold text-slate-200">
              ₹ {initial.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
