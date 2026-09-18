'use client';

import React, { useState, useMemo } from 'react';
import {
  forceLogoutBidderAction,
  resetBidderPasswordAction,
  toggleBidderActiveAction,
  createBidderTeamAction,
  updateBidderTeamAction,
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
  AlertTriangle,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  X,
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
        badge: 'bg-[#e5ece6] text-[#56695e] border border-[#cad7cc]',
        text: 'text-[#56695e]',
        dot: 'bg-[#56695e]',
      };
  }
}

export function generateRandomPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';

  const chars: string[] = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const all = upper + lower + digits + symbols;
  for (let i = 0; i < 6; i++) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Fisher-Yates shuffle for unbiased character distribution
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }

  return chars.join('');
}

export function getSuggestedUserId(bidders: { display_user_id: string }[]): string {
  let maxTeamNum = 0;
  bidders.forEach((b) => {
    const match = (b.display_user_id || '').match(/^TEAM[-_]?(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxTeamNum) maxTeamNum = num;
    }
  });
  const nextNum = maxTeamNum + 1;
  return `TEAM${String(nextNum).padStart(2, '0')}`;
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

  // Quick Password Reset Modal
  const [activePasswordModalUser, setActivePasswordModalUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showQuickPassword, setShowQuickPassword] = useState(false);

  // General action status banner
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTeamName, setCreateTeamName] = useState('');
  const [createDisplayUserId, setCreateDisplayUserId] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createInitialPurse, setCreateInitialPurse] = useState<number>(50000);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingBidder, setEditingBidder] = useState<(Profile & { wallet?: BidderWallet }) | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editDisplayUserId, setEditDisplayUserId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Close active modals on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreateModalOpen) setIsCreateModalOpen(false);
        if (editingBidder) setEditingBidder(null);
        if (activePasswordModalUser) {
          setActivePasswordModalUser(null);
          setNewPassword('');
          setShowQuickPassword(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, editingBidder, activePasswordModalUser]);

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
      } else {
        setStatusMessage(`Error: ${res.error}`);
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
        setShowQuickPassword(false);
        if (onRefresh) onRefresh();
      } else {
        setStatusMessage(`Error: ${res.error}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Creation Modal Handlers
  const handleOpenCreateModal = () => {
    setCreateDisplayUserId(getSuggestedUserId(bidders));
    setCreateTeamName('');
    setCreatePassword(generateRandomPassword());
    setShowCreatePassword(false);
    setCreateInitialPurse(50000);
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;

    const cleanTeam = createTeamName.trim();
    if (!cleanTeam) {
      setCreateError('Team Name is required.');
      return;
    }
    if (cleanTeam.length > 100) {
      setCreateError('Team Name must not exceed 100 characters.');
      return;
    }

    const cleanId = createDisplayUserId.trim().toUpperCase();
    if (!cleanId) {
      setCreateError('User ID is required.');
      return;
    }
    if (!/^[A-Z0-9_-]{2,30}$/.test(cleanId) || !/[A-Z0-9]/.test(cleanId)) {
      setCreateError('User ID must be 2-30 alphanumeric characters (hyphens and underscores allowed).');
      return;
    }

    if (!createPassword || createPassword.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }
    if (!Number.isFinite(createInitialPurse) || createInitialPurse < 0) {
      setCreateError('Initial purse must be a valid non-negative number.');
      return;
    }
    if (createInitialPurse > 1000000000) {
      setCreateError('Initial purse cannot exceed ₹1,000,000,000.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await createBidderTeamAction({
        displayUserId: cleanId,
        teamName: cleanTeam,
        password: createPassword,
        initialPurse: createInitialPurse,
      });

      if (res.success) {
        setStatusMessage(`Team "${cleanTeam}" (${cleanId}) created successfully with ₹${createInitialPurse.toLocaleString('en-IN')} purse.`);
        setIsCreateModalOpen(false);
        if (onRefresh) onRefresh();
      } else {
        setCreateError(res.error || 'Failed to create bidder team.');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  // Edit Modal Handlers
  const handleOpenEditModal = (b: Profile & { wallet?: BidderWallet }) => {
    setEditingBidder(b);
    setEditDisplayUserId(b.display_user_id);
    setEditTeamName(b.team_name);
    setEditPassword('');
    setShowEditPassword(false);
    setEditIsActive(b.is_active);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingEdit || !editingBidder) return;

    const cleanTeam = editTeamName.trim();
    if (!cleanTeam) {
      setEditError('Team Name is required.');
      return;
    }
    if (cleanTeam.length > 100) {
      setEditError('Team Name must not exceed 100 characters.');
      return;
    }

    const cleanId = editDisplayUserId.trim().toUpperCase();
    if (!cleanId) {
      setEditError('User ID is required.');
      return;
    }
    if (!/^[A-Z0-9_-]{2,30}$/.test(cleanId) || !/[A-Z0-9]/.test(cleanId)) {
      setEditError('User ID must be 2-30 alphanumeric characters (hyphens and underscores allowed).');
      return;
    }

    if (editPassword && editPassword.length < 6) {
      setEditError('New password must be at least 6 characters.');
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      const res = await updateBidderTeamAction({
        userId: editingBidder.id,
        displayUserId: cleanId,
        teamName: cleanTeam,
        password: editPassword || undefined,
        isActive: editIsActive,
      });

      if (res.success) {
        setStatusMessage(`Team "${cleanTeam}" (${cleanId}) updated successfully.`);
        setEditingBidder(null);
        if (onRefresh) onRefresh();
      } else {
        setEditError(res.error || 'Failed to update bidder team.');
      }
    } catch (err: any) {
      setEditError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingEdit(false);
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
                {bidders.length} Teams
              </span>
            </h3>
            <p className="text-xs text-[#56695e]">Purse telemetry, escrow exposure & session control</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          {/* + Add Bidder Team Button */}
          <button
            onClick={handleOpenCreateModal}
            aria-label="+ Add Bidder Team"
            className="px-3.5 py-1.5 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#1a5c3e]/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bidder Team</span>
          </button>
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
            <span className="w-2 h-2 rounded-full bg-[#56695e]" />
            <span>Depleted (₹0)</span>
            <span className="font-mono text-[10px]">({tierCounts.depleted})</span>
          </button>
        </div>

        {/* Quick Sorting Dropdown / Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#56695e] font-medium">Sort by:</span>
          <button
            onClick={() => handleSort('available')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
              sortField === 'available'
                ? 'bg-[#1a5c3e]/10 text-[#1a5c3e] border-[#1a5c3e]/30'
                : 'bg-[#e5ece6] text-[#56695e] border-[#cad7cc] hover:text-[#203126] hover:bg-[#d8e3da]'
            }`}
          >
            Liquidity {sortField === 'available' && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSort('locked')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
              sortField === 'locked'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-[#e5ece6] text-[#56695e] border-[#cad7cc] hover:text-[#203126] hover:bg-[#d8e3da]'
            }`}
          >
            Exposure {sortField === 'locked' && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSort('team_name')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
              sortField === 'team_name'
                ? 'bg-[#1a5c3e]/10 text-[#1a5c3e] border-[#1a5c3e]/30'
                : 'bg-[#e5ece6] text-[#56695e] border-[#cad7cc] hover:text-[#203126] hover:bg-[#d8e3da]'
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
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Table */}
      <div className="overflow-x-auto rounded-lg border border-[#cad7cc] shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#e5ece6] border-b border-[#cad7cc] text-[#56695e] uppercase text-[10px] font-semibold tracking-wider select-none">
              <th
                onClick={() => handleSort('display_user_id')}
                className="py-3 px-4 cursor-pointer hover:text-[#203126] transition"
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
                className="py-3 px-4 cursor-pointer hover:text-[#203126] transition"
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
                className="py-3 px-4 cursor-pointer hover:text-[#203126] transition"
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
                className="py-3 px-4 text-right cursor-pointer hover:text-[#203126] transition"
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
                className="py-3 px-4 text-right cursor-pointer hover:text-[#203126] transition"
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
                className="py-3 px-4 text-right cursor-pointer hover:text-[#203126] transition"
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
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#203126]">
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
                        <div className="font-semibold text-[#203126] line-clamp-1">{b.team_name}</div>
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
                            online ? 'bg-emerald-600 animate-pulse' : 'bg-[#56695e]/40'
                          }`}
                        />
                        <span className={online ? 'text-emerald-800 font-semibold text-xs' : 'text-[#56695e] text-xs'}>
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>

                    {/* Available Purse */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-sm">
                      <span className={tierCfg.text}>₹{available.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-[#56695e] block font-normal">
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
                        <span className="text-[#56695e] text-xs font-normal">₹0</span>
                      )}
                    </td>

                    {/* Total Invested */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#203126]">
                      <span>₹{spent.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-[#56695e] block font-normal">
                        ({spentPct.toFixed(0)}% used)
                      </span>
                    </td>

                    {/* Purse Utilization Progress Indicator */}
                    <td className="py-3.5 px-4 min-w-[120px]">
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-[#d8e3da] rounded-full overflow-hidden flex border border-[#cad7cc]">
                          <div
                            style={{ width: `${spentPct}%` }}
                            title={`Spent: ₹${spent.toLocaleString('en-IN')} (${spentPct.toFixed(1)}%)`}
                            className="bg-[#203126] transition-all duration-300"
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
                        <div className="flex items-center justify-between text-[9px] font-mono text-[#56695e]">
                          <span>₹0</span>
                          <span>₹{(initial / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    </td>

                    {/* Action Controls */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          title="Edit Team Details"
                          aria-label={`Edit ${b.team_name}`}
                          className="p-1.5 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] text-[#203126] border border-[#cad7cc] transition"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#1a5c3e]" />
                        </button>

                        <button
                          onClick={() => {
                            setActivePasswordModalUser(b.id);
                            setNewPassword(generateRandomPassword());
                            setShowQuickPassword(false);
                          }}
                          title="Quick Password Reset"
                          className="p-1.5 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] text-[#203126] border border-[#cad7cc] transition"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#1a5c3e]" />
                        </button>

                        <button
                          onClick={() => handleForceLogout(b.id)}
                          disabled={isProcessing}
                          title="Force Disconnect / Kick Active Session"
                          className="p-1.5 rounded-md bg-[#e5ece6] hover:bg-red-50 text-[#203126] hover:text-red-700 border border-[#cad7cc] hover:border-red-200 transition disabled:opacity-50"
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

      {/* Quick Password Reset Modal Popup */}
      {activePasswordModalUser && (
        <div className="p-4 rounded-xl bg-[#eff4f0] border border-[#cad7cc] space-y-2.5 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#203126] block">
              Quick Password Reset for {bidders.find((b) => b.id === activePasswordModalUser)?.team_name}:
            </span>
            <button
              type="button"
              onClick={() => {
                setNewPassword(generateRandomPassword());
                setShowQuickPassword(true);
              }}
              className="text-[11px] text-[#1a5c3e] hover:underline flex items-center gap-1 font-semibold"
            >
              <Sparkles className="w-3 h-3" />
              <span>Generate Random</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type={showQuickPassword ? 'text' : 'password'}
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs font-mono text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
              />
              <button
                type="button"
                onClick={() => setShowQuickPassword(!showQuickPassword)}
                className="absolute right-2.5 top-2.5 text-[#56695e] hover:text-[#203126]"
              >
                {showQuickPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              onClick={() => handleResetPassword(activePasswordModalUser)}
              disabled={isProcessing}
              className="px-4 py-2 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
            >
              Update Password
            </button>
            <button
              onClick={() => {
                setActivePasswordModalUser(null);
                setNewPassword('');
                setShowQuickPassword(false);
              }}
              className="px-4 py-2 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] text-xs font-semibold text-[#203126] border border-[#cad7cc] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <div
          onClick={() => !isCreating && setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#203126]/50 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl bg-[#eff4f0] border border-[#cad7cc] shadow-2xl p-6 relative flex flex-col text-[#203126] max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#cad7cc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 flex items-center justify-center text-[#1a5c3e]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#203126]">Add New Bidder Team</h3>
                  <p className="text-xs text-[#56695e]">Provision credentials and allocate initial auction purse</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] text-[#56695e] hover:text-[#203126] border border-[#cad7cc] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {createError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {/* Team Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#203126] block">
                  Team Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Ventures"
                  value={createTeamName}
                  onChange={(e) => {
                    setCreateTeamName(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  className="w-full px-3 py-2 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
                  required
                />
              </div>

              {/* User ID with auto-suggestion */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#203126] block">
                    User ID <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateDisplayUserId(getSuggestedUserId(bidders))}
                    className="text-[11px] font-mono text-[#1a5c3e] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-suggest ({getSuggestedUserId(bidders)})</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. TEAM16"
                  value={createDisplayUserId}
                  onChange={(e) => {
                    setCreateDisplayUserId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                    if (createError) setCreateError(null);
                  }}
                  className="w-full px-3 py-2 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs font-mono text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
                  required
                />
                <p className="text-[10px] text-[#56695e]">
                  Unique identifier used by team members to log in (maps to {createDisplayUserId ? createDisplayUserId.toLowerCase().replace(/[^a-z0-9]/g, '') : 'id'}@seep.internal).
                </p>
              </div>

              {/* Password with generator shortcut */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#203126] block">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setCreatePassword(pwd);
                      setShowCreatePassword(true);
                    }}
                    className="text-[11px] text-[#1a5c3e] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    placeholder="Enter at least 6 characters"
                    value={createPassword}
                    onChange={(e) => {
                      setCreatePassword(e.target.value);
                      if (createError) setCreateError(null);
                    }}
                    className="w-full pl-3 pr-9 py-2 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs font-mono text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-2.5 top-2.5 text-[#56695e] hover:text-[#203126]"
                  >
                    {showCreatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#56695e]">
                  Share this password with the bidder team lead for initial authentication.
                </p>
              </div>

              {/* Initial Purse */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#203126] block">
                    Initial Purse (₹) <span className="text-red-600">*</span>
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-[#56695e]">Presets:</span>
                    {[25000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCreateInitialPurse(amt)}
                        className={`px-1.5 py-0.5 rounded border transition font-mono ${
                          createInitialPurse === amt
                            ? 'bg-[#1a5c3e] text-white border-[#1a5c3e]'
                            : 'bg-[#e5ece6] text-[#203126] border-[#cad7cc] hover:bg-[#d8e3da]'
                        }`}
                      >
                        ₹{(amt / 1000)}k
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={createInitialPurse}
                  onChange={(e) => {
                    setCreateInitialPurse(Number(e.target.value));
                    if (createError) setCreateError(null);
                  }}
                  className="w-full px-3 py-2 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs font-mono text-[#203126] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
                  required
                />
                <p className="text-[10px] text-[#56695e]">
                  Initial allocation sets available balance to ₹{createInitialPurse.toLocaleString('en-IN')} with ₹0 locked and ₹0 spent.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#cad7cc] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] text-xs font-semibold text-[#203126] border border-[#cad7cc] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Team...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Team</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bidder Team Modal */}
      {editingBidder && (
        <div
          onClick={() => !isSavingEdit && setEditingBidder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#203126]/50 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl bg-[#eff4f0] border border-[#cad7cc] shadow-2xl p-6 relative flex flex-col text-[#203126] max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#cad7cc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1a5c3e]/10 border border-[#1a5c3e]/20 flex items-center justify-center text-[#1a5c3e]">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#203126]">
                    Edit Team: {editingBidder.team_name}
                  </h3>
                  <p className="text-xs text-[#56695e]">
                    Update User ID, credentials, and active participation status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingBidder(null)}
                className="p-1.5 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] text-[#56695e] hover:text-[#203126] border border-[#cad7cc] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {editError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {/* Team Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#203126] block">
                  Team Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={editTeamName}
                  onChange={(e) => {
                    setEditTeamName(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  className="w-full px-3 py-2 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
                  required
                />
              </div>

              {/* User ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#203126] block">
                  User ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={editDisplayUserId}
                  onChange={(e) => {
                    setEditDisplayUserId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                    if (editError) setEditError(null);
                  }}
                  className="w-full px-3 py-2 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs font-mono text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
                  required
                />
                <p className="text-[10px] text-[#56695e]">
                  Modifying User ID updates login email ({editDisplayUserId ? editDisplayUserId.toLowerCase().replace(/[^a-z0-9]/g, '') : ''}@seep.internal) and forces re-authentication.
                </p>
              </div>

              {/* Password update */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#203126] block">
                    Password <span className="text-[11px] text-[#56695e] font-normal">(leave blank to keep unchanged)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setEditPassword(pwd);
                      setShowEditPassword(true);
                    }}
                    className="text-[11px] text-[#1a5c3e] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 characters)"
                    value={editPassword}
                    onChange={(e) => {
                      setEditPassword(e.target.value);
                      if (editError) setEditError(null);
                    }}
                    className="w-full pl-3 pr-9 py-2 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs font-mono text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-2.5 text-[#56695e] hover:text-[#203126]"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Active / Deactivated toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#203126] block">Account Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsActive(true)}
                    className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      editIsActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                        : 'bg-[#e5ece6] text-[#56695e] border-[#cad7cc] hover:bg-[#d8e3da]'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(false)}
                    className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      !editIsActive
                        ? 'bg-red-50 text-red-800 border-red-300 shadow-sm'
                        : 'bg-[#e5ece6] text-[#56695e] border-[#cad7cc] hover:bg-[#d8e3da]'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                    <span>Deactivated</span>
                  </button>
                </div>
                {!editIsActive && (
                  <p className="text-[10px] text-red-700 font-medium">
                    Deactivating this team disables bidding, blocks login, and kicks existing sessions.
                  </p>
                )}
              </div>

              {/* Invalidation Notice */}
              <div className="p-2.5 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-[11px] text-[#56695e] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1a5c3e] shrink-0 mt-0.5" />
                <span>
                  Updating User ID, setting a new password, or deactivating the account triggers automatic session invalidation and revokes all active auth tokens.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#cad7cc] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBidder(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-md bg-[#e5ece6] hover:bg-[#d8e3da] text-xs font-semibold text-[#203126] border border-[#cad7cc] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
