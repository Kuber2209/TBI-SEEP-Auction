'use client';

import React, { useState, useMemo } from 'react';
import {
  forceLogoutBidderAction,
  resetBidderPasswordAction,
  toggleBidderActiveAction,
} from '@/lib/auth/actions';
import { BidderWallet, Profile } from '@/lib/supabase/types';
import {
  Users,
  LogOut,
  KeyRound,
  CheckCircle,
  XCircle,
  Search,
  Lock,
  CheckCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export type LiquidityTier = 'flush' | 'moderate' | 'critical' | 'depleted';

export function getLiquidityTier(available: number): LiquidityTier {
  if (available <= 0) return 'depleted';
  if (available < 15000) return 'critical';
  if (available <= 35000) return 'moderate';
  return 'flush';
}

export function getTierConfig(tier: LiquidityTier) {
  switch (tier) {
    case 'flush':
      return {
        label: 'Flush (>₹35k)',
        badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        text: 'text-emerald-400',
        dot: 'bg-emerald-400',
      };
    case 'moderate':
      return {
        label: 'Moderate (₹15k-₹35k)',
        badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        text: 'text-amber-400',
        dot: 'bg-amber-400',
      };
    case 'critical':
      return {
        label: 'Critical (<₹15k)',
        badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        text: 'text-rose-400',
        dot: 'bg-rose-400',
      };
    case 'depleted':
      return {
        label: 'Depleted (₹0)',
        badge: 'bg-slate-800/80 text-rose-400 border border-rose-900/50',
        text: 'text-slate-400',
        dot: 'bg-rose-600',
      };
  }
}

type SortField = 'display_user_id' | 'team_name' | 'available' | 'locked' | 'spent' | 'status';
type SortDirection = 'asc' | 'desc';

interface BidderRosterTableProps {
  bidders: (Profile & { wallet?: BidderWallet })[];
  isUserOnline: (userId: string) => boolean;
  onRefresh?: () => void;
}

export function BidderRosterTable({
  bidders,
  isUserOnline,
  onRefresh,
}: BidderRosterTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | LiquidityTier>('all');
  const [sortField, setSortField] = useState<SortField>('available');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const [activePasswordModalUser, setActivePasswordModalUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Aggregate totals
  const totalPurse = bidders.reduce((sum, b) => sum + Number(b.wallet?.initial_balance || 0), 0);
  const totalAvailable = bidders.reduce((sum, b) => sum + Number(b.wallet?.available_balance || 0), 0);
  const totalSpent = bidders.reduce((sum, b) => sum + Number(b.wallet?.total_spent || 0), 0);
  const totalLocked = bidders.reduce((sum, b) => sum + Number(b.wallet?.locked_balance || 0), 0);

  // Tier counts
  const tierCounts = useMemo(() => {
    const counts = { all: bidders.length, flush: 0, moderate: 0, critical: 0, depleted: 0 };
    bidders.forEach((b) => {
      const avail = Number(b.wallet?.available_balance || 0);
      const tier = getLiquidityTier(avail);
      counts[tier]++;
    });
    return counts;
  }, [bidders]);

  // Handle column header sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'team_name' || field === 'display_user_id' ? 'asc' : 'desc');
    }
  };

  // Filter and Sort
  const processedBidders = useMemo(() => {
    return bidders
      .filter((b) => {
        const matchesSearch =
          b.display_user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.team_name.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (tierFilter !== 'all') {
          const avail = Number(b.wallet?.available_balance || 0);
          const tier = getLiquidityTier(avail);
          if (tier !== tierFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortField) {
          case 'display_user_id':
            valA = a.display_user_id;
            valB = b.display_user_id;
            break;
          case 'team_name':
            valA = a.team_name.toLowerCase();
            valB = b.team_name.toLowerCase();
            break;
          case 'available':
            valA = Number(a.wallet?.available_balance || 0);
            valB = Number(b.wallet?.available_balance || 0);
            break;
          case 'locked':
            valA = Number(a.wallet?.locked_balance || 0);
            valB = Number(b.wallet?.locked_balance || 0);
            break;
          case 'spent':
            valA = Number(a.wallet?.total_spent || 0);
            valB = Number(b.wallet?.total_spent || 0);
            break;
          case 'status':
            valA = isUserOnline(a.id) ? 1 : 0;
            valB = isUserOnline(b.id) ? 1 : 0;
            break;
          default:
            valA = 0;
            valB = 0;
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [bidders, searchTerm, tierFilter, sortField, sortDir, isUserOnline]);

  const handleForceLogout = async (userId: string) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await forceLogoutBidderAction(userId);
      if (res.success) {
        setStatusMessage('Bidder session successfully revoked and kicked.');
        if (onRefresh) onRefresh();
      } else {
        setStatusMessage(`Error: ${res.error}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await toggleBidderActiveAction(userId, !currentActive);
      if (res.success) {
        setStatusMessage(`Account status updated.`);
        if (onRefresh) onRefresh();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await resetBidderPasswordAction(userId, newPassword);
      if (res.success) {
        setStatusMessage('Password updated successfully.');
        setActivePasswordModalUser(null);
        setNewPassword('');
        if (onRefresh) onRefresh();
      } else {
        setStatusMessage(`Error: ${res.error}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-card rounded-[24px] p-6 sm:p-7 border border-white/[0.07] shadow-sm space-y-6">
      {/* Top Header & Aggregate Financial Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[16px] bg-seep-sky/15 border border-seep-sky/30 flex items-center justify-center text-seep-sky shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Bidder Teams Financial Roster</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-900 border border-navy-700 text-slate-400">
                15 Teams
              </span>
            </h3>
            <p className="text-xs text-slate-400">Live purse monitoring, escrow exposure & session security</p>
          </div>
        </div>

        {/* Aggregate Stats Bar */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="px-3.5 py-1.5 rounded-[12px] bg-navy-900/90 border border-white/[0.07] flex items-center gap-2">
            <span className="text-slate-400 font-medium">Allocated:</span>
            <strong className="text-white font-mono font-black">₹{totalPurse.toLocaleString('en-IN')}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-[12px] bg-navy-900/90 border border-emerald-500/30 flex items-center gap-2">
            <span className="text-slate-400 font-medium">Liquid:</span>
            <strong className="text-emerald-400 font-mono font-black">₹{totalAvailable.toLocaleString('en-IN')}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-[12px] bg-navy-900/90 border border-amber-500/30 flex items-center gap-2">
            <span className="text-slate-400 font-medium">In Escrow:</span>
            <strong className="text-amber-400 font-mono font-black">₹{totalLocked.toLocaleString('en-IN')}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-[12px] bg-navy-900/90 border border-seep-sky/30 flex items-center gap-2">
            <span className="text-slate-400 font-medium">Spent:</span>
            <strong className="text-seep-sky font-mono font-black">₹{totalSpent.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Sorting Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Liquidity Tier Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition flex items-center gap-1.5 ${
              tierFilter === 'all'
                ? 'bg-gold-500 text-navy-950 shadow-sm'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-white/[0.07]'
            }`}
          >
            <span>All Teams</span>
            <span className="font-mono text-[10px] opacity-80">({tierCounts.all})</span>
          </button>

          <button
            onClick={() => setTierFilter('flush')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition flex items-center gap-1.5 ${
              tierFilter === 'flush'
                ? 'bg-emerald-500 text-navy-950 font-black shadow-md'
                : 'bg-navy-900 text-emerald-400/80 hover:text-emerald-300 border border-emerald-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Flush (&gt;₹35k)</span>
            <span className="font-mono text-[10px]">({tierCounts.flush})</span>
          </button>

          <button
            onClick={() => setTierFilter('moderate')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition flex items-center gap-1.5 ${
              tierFilter === 'moderate'
                ? 'bg-amber-500 text-navy-950 font-black shadow-md'
                : 'bg-navy-900 text-amber-400/80 hover:text-amber-300 border border-amber-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Moderate (₹15k-₹35k)</span>
            <span className="font-mono text-[10px]">({tierCounts.moderate})</span>
          </button>

          <button
            onClick={() => setTierFilter('critical')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition flex items-center gap-1.5 ${
              tierFilter === 'critical'
                ? 'bg-rose-500 text-white font-black shadow-md'
                : 'bg-navy-900 text-rose-400/80 hover:text-rose-300 border border-rose-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Critical (&lt;₹15k)</span>
            <span className="font-mono text-[10px]">({tierCounts.critical})</span>
          </button>

          <button
            onClick={() => setTierFilter('depleted')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition flex items-center gap-1.5 ${
              tierFilter === 'depleted'
                ? 'bg-slate-700 text-rose-300 font-black shadow-md'
                : 'bg-navy-900 text-slate-500 hover:text-slate-300 border border-white/[0.07]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Depleted (₹0)</span>
            <span className="font-mono text-[10px]">({tierCounts.depleted})</span>
          </button>
        </div>

        {/* Quick Sorting Dropdown / Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Sort by:</span>
          <button
            onClick={() => handleSort('available')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
              sortField === 'available'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-navy-900 text-slate-400 border-white/[0.07] hover:text-white'
            }`}
          >
            Liquidity {sortField === 'available' && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSort('locked')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
              sortField === 'locked'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-navy-900 text-slate-400 border-white/[0.07] hover:text-white'
            }`}
          >
            Exposure {sortField === 'locked' && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSort('team_name')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
              sortField === 'team_name'
                ? 'bg-seep-sky/20 text-seep-sky border-seep-sky/40'
                : 'bg-navy-900 text-slate-400 border-white/[0.07] hover:text-white'
            }`}
          >
            Team Name {sortField === 'team_name' && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team name or User ID (e.g. TEAM05)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-[12px] bg-navy-950 border border-white/[0.07] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {processedBidders.length} of {bidders.length} Teams
        </span>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-[16px] bg-navy-900 border border-gold-500/40 text-gold-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCheck className="w-4 h-4 text-gold-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Interactive Table */}
      <div className="overflow-x-auto rounded-[16px] border border-white/[0.07] shadow-lg">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-navy-950/90 border-b border-white/[0.07] text-slate-400 uppercase text-[10px] font-black tracking-wider select-none">
              <th
                onClick={() => handleSort('display_user_id')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>User ID</span>
                  {sortField === 'display_user_id' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-gold-400" /> : <ArrowDown className="w-3 h-3 text-gold-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('team_name')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Team Name & Tier</span>
                  {sortField === 'team_name' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-gold-400" /> : <ArrowDown className="w-3 h-3 text-gold-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Live Status</span>
                  {sortField === 'status' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-gold-400" /> : <ArrowDown className="w-3 h-3 text-gold-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('available')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Available Liquidity</span>
                  {sortField === 'available' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-gold-400" /> : <ArrowDown className="w-3 h-3 text-gold-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('locked')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Active Escrow</span>
                  {sortField === 'locked' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-gold-400" /> : <ArrowDown className="w-3 h-3 text-gold-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('spent')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Spent / Deployed</span>
                  {sortField === 'spent' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-gold-400" /> : <ArrowDown className="w-3 h-3 text-gold-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-center">Purse Utilization</th>
              <th className="py-3 px-4 text-center">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/90 bg-navy-950/40">
            {processedBidders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                  No bidder teams matching current search or tier filter.
                </td>
              </tr>
            ) : (
              processedBidders.map((b) => {
                const online = isUserOnline(b.id);
                const wallet = b.wallet;
                const initial = Number(wallet?.initial_balance || 50000);
                const available = Number(wallet?.available_balance || 0);
                const locked = Number(wallet?.locked_balance || 0);
                const spent = Number(wallet?.total_spent || 0);

                const tier = getLiquidityTier(available);
                const tierCfg = getTierConfig(tier);

                const spentPct = Math.min(100, (spent / (initial || 1)) * 100);
                const lockedPct = Math.min(100, (locked / (initial || 1)) * 100);
                const availPct = Math.max(0, 100 - spentPct - lockedPct);

                // Financial conservation verification: initial === available + locked + spent
                const isConserved = initial === (available + locked + spent);

                return (
                  <tr key={b.id} className="hover:bg-navy-900/50 transition">
                    {/* User ID */}
                    <td className="py-3.5 px-4 font-mono font-black text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{b.display_user_id}</span>
                        {!b.is_active && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
                            DISABLED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Team Name & Tier Badge */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-200 line-clamp-1">{b.team_name}</div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tierCfg.badge}`}>
                            {tier.toUpperCase()}
                          </span>
                          {!isConserved && (
                            <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Conservation Violation
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Live Connection Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                          }`}
                        />
                        <span className={online ? 'text-emerald-300 font-bold text-xs' : 'text-slate-500 text-xs'}>
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>

                    {/* Available Purse */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-sm">
                      <span className={tierCfg.text}>₹{available.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-500 block font-normal">
                        ({availPct.toFixed(0)}% free)
                      </span>
                    </td>

                    {/* Active Escrow Hold Badge */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {locked > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 animate-pulse shadow-sm">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span className="font-black">₹{locked.toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs font-normal">₹0</span>
                      )}
                    </td>

                    {/* Total Invested */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-seep-sky">
                      <span>₹{spent.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-500 block font-normal">
                        ({spentPct.toFixed(0)}% used)
                      </span>
                    </td>

                    {/* Purse Utilization Progress Indicator */}
                    <td className="py-3.5 px-4 min-w-[120px]">
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-navy-950 rounded-full overflow-hidden flex border border-white/[0.07] shadow-inner">
                          <div
                            style={{ width: `${spentPct}%` }}
                            title={`Spent: ₹${spent.toLocaleString('en-IN')} (${spentPct.toFixed(1)}%)`}
                            className="bg-seep-sky transition-all duration-300"
                          />
                          <div
                            style={{ width: `${lockedPct}%` }}
                            title={`In Escrow: ₹${locked.toLocaleString('en-IN')} (${lockedPct.toFixed(1)}%)`}
                            className="bg-amber-400 transition-all duration-300"
                          />
                          <div
                            style={{ width: `${availPct}%` }}
                            title={`Available: ₹${available.toLocaleString('en-IN')} (${availPct.toFixed(1)}%)`}
                            className={tier === 'flush' ? 'bg-emerald-500/50' : tier === 'moderate' ? 'bg-amber-500/30' : 'bg-rose-500/30'}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span>₹0</span>
                          <span>₹{(initial / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    </td>

                    {/* Action Controls */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActivePasswordModalUser(b.id)}
                          title="Reset Password"
                          className="p-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-slate-300 hover:text-white border border-white/[0.07] hover:border-gold-500/40 transition"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleForceLogout(b.id)}
                          disabled={isProcessing}
                          title="Force Disconnect / Kick Active Session"
                          className="p-1.5 rounded-lg bg-navy-900 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-white/[0.07] hover:border-rose-500/40 transition disabled:opacity-50"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleActive(b.id, b.is_active)}
                          disabled={isProcessing}
                          title={b.is_active ? 'Disable Account' : 'Enable Account'}
                          className={`p-1.5 rounded-lg border transition disabled:opacity-50 ${
                            b.is_active
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40'
                              : 'bg-rose-950/60 text-rose-400 border-rose-500/40 hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-500/30'
                          }`}
                        >
                          {b.is_active ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Password Reset Modal Popup */}
      {activePasswordModalUser && (
        <div className="p-4 rounded-[16px] bg-navy-950 border border-navy-700 space-y-2.5 animate-fade-in shadow-sm">
          <span className="text-xs font-bold text-white block">
            Update Password for {bidders.find((b) => b.id === activePasswordModalUser)?.team_name}:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-[12px] bg-navy-900 border border-navy-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-gold-500"
            />
            <button
              onClick={() => handleResetPassword(activePasswordModalUser)}
              className="px-4 py-2 rounded-[12px] bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs shadow-sm transition"
            >
              Update Password
            </button>
            <button
              onClick={() => {
                setActivePasswordModalUser(null);
                setNewPassword('');
              }}
              className="px-4 py-2 rounded-[12px] bg-navy-800 text-xs font-semibold text-slate-300 hover:bg-navy-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

