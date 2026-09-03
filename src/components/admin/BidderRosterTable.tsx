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
        badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        text: 'text-emerald-800',
        dot: 'bg-emerald-600',
      };
    case 'moderate':
      return {
        label: 'Moderate (₹15k-₹35k)',
        badge: 'bg-amber-50 text-amber-800 border border-amber-200',
        text: 'text-amber-800',
        dot: 'bg-amber-600',
      };
    case 'critical':
      return {
        label: 'Critical (<₹15k)',
        badge: 'bg-red-50 text-red-800 border border-red-200',
        text: 'text-red-800',
        dot: 'bg-red-600',
      };
    case 'depleted':
      return {
        label: 'Depleted (₹0)',
        badge: 'bg-slate-100 text-slate-700 border border-slate-200',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
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
    <div className="rounded-xl p-5 sm:p-6 bg-[#eff4f0] border border-[#cad7cc] shadow-sm space-y-6 transition-colors duration-150">
      {/* Top Header & Aggregate Financial Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#cad7cc]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 flex items-center justify-center text-[#1a5c3e]">
            <Users className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#203126] flex items-center gap-2">
              <span>Investor Teams Financial Roster</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#e5ece6] text-[#56695e] border border-[#cad7cc]">
                15 Teams
              </span>
            </h3>
            <p className="text-xs text-[#56695e]">Purse telemetry, escrow exposure & session control</p>
          </div>
        </div>

        {/* Aggregate Stats Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-md bg-[#e5ece6] border border-[#cad7cc] flex items-center gap-1.5">
            <span className="text-[#56695e]">Total Purse:</span>
            <strong className="text-[#203126] font-mono tabular-nums">₹{totalPurse.toLocaleString('en-IN')}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
            <span className="text-[#56695e]">Liquid Cash:</span>
            <strong className="text-emerald-800 font-mono tabular-nums">₹{totalAvailable.toLocaleString('en-IN')}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5">
            <span className="text-[#56695e]">In Escrow:</span>
            <strong className="text-amber-800 font-mono tabular-nums">₹{totalLocked.toLocaleString('en-IN')}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-[#e5ece6] border border-[#cad7cc] flex items-center gap-1.5">
            <span className="text-[#56695e]">Spent:</span>
            <strong className="text-[#203126] font-mono tabular-nums">₹{totalSpent.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Sorting Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Liquidity Tier Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              tierFilter === 'all'
                ? 'bg-[#1a5c3e] text-white shadow-sm'
                : 'bg-[#e5ece6] text-[#203126] hover:bg-[#d8e3da] border border-[#cad7cc]'
            }`}
          >
            <span>All Teams</span>
            <span className="font-mono text-[10px] opacity-80">({tierCounts.all})</span>
          </button>

          <button
            onClick={() => setTierFilter('flush')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              tierFilter === 'flush'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-[#e5ece6] text-emerald-800 hover:bg-emerald-50 border border-[#cad7cc]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Flush (&gt;₹35k)</span>
            <span className="font-mono text-[10px]">({tierCounts.flush})</span>
          </button>

          <button
            onClick={() => setTierFilter('moderate')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              tierFilter === 'moderate'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-[#e5ece6] text-amber-800 hover:bg-amber-50 border border-[#cad7cc]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>Moderate (₹15k-₹35k)</span>
            <span className="font-mono text-[10px]">({tierCounts.moderate})</span>
          </button>

          <button
            onClick={() => setTierFilter('critical')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              tierFilter === 'critical'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-[#e5ece6] text-red-800 hover:bg-red-50 border border-[#cad7cc]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>Critical (&lt;₹15k)</span>
            <span className="font-mono text-[10px]">({tierCounts.critical})</span>
          </button>

          <button
            onClick={() => setTierFilter('depleted')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              tierFilter === 'depleted'
                ? 'bg-[#203126] text-white shadow-sm'
                : 'bg-[#e5ece6] text-[#56695e] hover:bg-[#d8e3da] border border-[#cad7cc]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Depleted (₹0)</span>
            <span className="font-mono text-[10px]">({tierCounts.depleted})</span>
          </button>
        </div>

        {/* Quick Sorting Dropdown / Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6b7a8d] font-medium">Sort by:</span>
          <button
            onClick={() => handleSort('available')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
              sortField === 'available'
                ? 'bg-[#1a5c3e]/10 text-[#1a5c3e] border-[#1a5c3e]/30'
                : 'bg-white text-[#6b7a8d] border-[#e2e5ea] hover:text-[#33404f]'
            }`}
          >
            Liquidity {sortField === 'available' && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSort('locked')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
              sortField === 'locked'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-[#6b7a8d] border-[#e2e5ea] hover:text-[#33404f]'
            }`}
          >
            Exposure {sortField === 'locked' && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSort('team_name')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
              sortField === 'team_name'
                ? 'bg-[#1a5c3e]/10 text-[#1a5c3e] border-[#1a5c3e]/30'
                : 'bg-white text-[#6b7a8d] border-[#e2e5ea] hover:text-[#33404f]'
            }`}
          >
            Team Name {sortField === 'team_name' && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#56695e]" />
          <input
            type="text"
            placeholder="Search by team name or User ID (e.g. TEAM05)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
          />
        </div>

        <span className="text-xs font-mono text-[#56695e]">
          Showing {processedBidders.length} of {bidders.length} Teams
        </span>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Interactive Table */}
      <div className="overflow-x-auto rounded-lg border border-[#cad7cc] shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#e5ece6] border-b border-[#cad7cc] text-[#56695e] uppercase text-[10px] font-semibold tracking-wider select-none">
              <th
                onClick={() => handleSort('display_user_id')}
                className="py-3 px-4 cursor-pointer hover:text-[#33404f] transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>User ID</span>
                  {sortField === 'display_user_id' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1a5c3e]" /> : <ArrowDown className="w-3 h-3 text-[#1a5c3e]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('team_name')}
                className="py-3 px-4 cursor-pointer hover:text-[#33404f] transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Team Name & Tier</span>
                  {sortField === 'team_name' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1a5c3e]" /> : <ArrowDown className="w-3 h-3 text-[#1a5c3e]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-4 cursor-pointer hover:text-[#33404f] transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Live Status</span>
                  {sortField === 'status' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1a5c3e]" /> : <ArrowDown className="w-3 h-3 text-[#1a5c3e]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('available')}
                className="py-3 px-4 text-right cursor-pointer hover:text-[#33404f] transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Available Liquidity</span>
                  {sortField === 'available' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1a5c3e]" /> : <ArrowDown className="w-3 h-3 text-[#1a5c3e]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('locked')}
                className="py-3 px-4 text-right cursor-pointer hover:text-[#33404f] transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Active Escrow</span>
                  {sortField === 'locked' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1a5c3e]" /> : <ArrowDown className="w-3 h-3 text-[#1a5c3e]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('spent')}
                className="py-3 px-4 text-right cursor-pointer hover:text-[#33404f] transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Spent / Deployed</span>
                  {sortField === 'spent' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1a5c3e]" /> : <ArrowDown className="w-3 h-3 text-[#1a5c3e]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-center">Purse Utilization</th>
              <th className="py-3 px-4 text-center">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#cad7cc] bg-[#eff4f0]">
            {processedBidders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#56695e] italic">
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
                  <tr key={b.id} className="hover:bg-[#e5ece6] transition">
                    {/* User ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#33404f]">
                      <div className="flex items-center gap-1.5">
                        <span>{b.display_user_id}</span>
                        {!b.is_active && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-50 text-red-700 border border-red-200 font-semibold">
                            DISABLED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Team Name & Tier Badge */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-[#33404f] line-clamp-1">{b.team_name}</div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${tierCfg.badge}`}>
                            {tier.toUpperCase()}
                          </span>
                          {!isConserved && (
                            <span className="text-[10px] text-red-700 font-semibold flex items-center gap-1">
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
                            online ? 'bg-emerald-600 animate-pulse' : 'bg-[#6b7a8d]/40'
                          }`}
                        />
                        <span className={online ? 'text-emerald-800 font-semibold text-xs' : 'text-[#6b7a8d] text-xs'}>
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>

                    {/* Available Purse */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-sm">
                      <span className={tierCfg.text}>₹{available.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-[#6b7a8d] block font-normal">
                        ({availPct.toFixed(0)}% free)
                      </span>
                    </td>

                    {/* Active Escrow Hold Badge */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold">
                      {locked > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 shadow-sm">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span className="font-semibold">₹{locked.toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="text-[#6b7a8d] text-xs font-normal">₹0</span>
                      )}
                    </td>

                    {/* Total Invested */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#33404f]">
                      <span>₹{spent.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-[#6b7a8d] block font-normal">
                        ({spentPct.toFixed(0)}% used)
                      </span>
                    </td>

                    {/* Purse Utilization Progress Indicator */}
                    <td className="py-3.5 px-4 min-w-[120px]">
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-[#f1f4f7] rounded-full overflow-hidden flex border border-[#e2e5ea]">
                          <div
                            style={{ width: `${spentPct}%` }}
                            title={`Spent: ₹${spent.toLocaleString('en-IN')} (${spentPct.toFixed(1)}%)`}
                            className="bg-[#33404f] transition-all duration-300"
                          />
                          <div
                            style={{ width: `${lockedPct}%` }}
                            title={`In Escrow: ₹${locked.toLocaleString('en-IN')} (${lockedPct.toFixed(1)}%)`}
                            className="bg-amber-500 transition-all duration-300"
                          />
                          <div
                            style={{ width: `${availPct}%` }}
                            title={`Available: ₹${available.toLocaleString('en-IN')} (${availPct.toFixed(1)}%)`}
                            className="bg-[#1a5c3e] transition-all duration-300"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-[#6b7a8d]">
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
                          className="p-1.5 rounded-md bg-[#f1f4f7] hover:bg-[#e2e5ea] text-[#33404f] border border-[#e2e5ea] transition"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#1a5c3e]" />
                        </button>

                        <button
                          onClick={() => handleForceLogout(b.id)}
                          disabled={isProcessing}
                          title="Force Disconnect / Kick Active Session"
                          className="p-1.5 rounded-md bg-[#f1f4f7] hover:bg-red-50 text-[#33404f] hover:text-red-700 border border-[#e2e5ea] hover:border-red-200 transition disabled:opacity-50"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleActive(b.id, b.is_active)}
                          disabled={isProcessing}
                          title={b.is_active ? 'Disable Account' : 'Enable Account'}
                          className={`p-1.5 rounded-md border transition disabled:opacity-50 ${
                            b.is_active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-red-50 hover:text-red-800 hover:border-red-200'
                              : 'bg-red-50 text-red-800 border-red-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
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
        <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] space-y-2.5 animate-fade-in shadow-sm">
          <span className="text-xs font-semibold text-[#33404f] block">
            Update Password for {bidders.find((b) => b.id === activePasswordModalUser)?.team_name}:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-md bg-white border border-[#e2e5ea] text-xs text-[#33404f] placeholder:text-[#6b7a8d] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
            />
            <button
              onClick={() => handleResetPassword(activePasswordModalUser)}
              className="px-4 py-2 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-white font-semibold text-xs shadow-sm transition"
            >
              Update Password
            </button>
            <button
              onClick={() => {
                setActivePasswordModalUser(null);
                setNewPassword('');
              }}
              className="px-4 py-2 rounded-md bg-[#f1f4f7] hover:bg-[#e2e5ea] text-xs font-semibold text-[#33404f] border border-[#e2e5ea]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

