'use client';

import React, { useState } from 'react';
import {
  forceLogoutBidderAction,
  resetBidderPasswordAction,
  toggleBidderActiveAction,
} from '@/lib/auth/actions';
import { BidderWallet, Profile } from '@/lib/supabase/types';
import { Users, LogOut, KeyRound, CheckCircle, XCircle, Search, Wallet, Lock, CheckCheck } from 'lucide-react';

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
  const [activePasswordModalUser, setActivePasswordModalUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = bidders.filter(
    (b) =>
      b.display_user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.team_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPurse = bidders.reduce((sum, b) => sum + Number(b.wallet?.initial_balance || 0), 0);
  const totalSpent = bidders.reduce((sum, b) => sum + Number(b.wallet?.total_spent || 0), 0);
  const totalLocked = bidders.reduce((sum, b) => sum + Number(b.wallet?.locked_balance || 0), 0);

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
    <div className="glass-card rounded-3xl p-6 sm:p-7 border border-navy-800/80 shadow-2xl space-y-5">
      {/* Top Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-seep-sky/15 border border-seep-sky/30 flex items-center justify-center text-seep-sky">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-white uppercase tracking-wider">
              Bidder Teams Financial Roster
            </h3>
            <p className="text-xs text-slate-400">Live purse monitoring & access management</p>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-800">
            <span className="text-slate-400">Total Allocated: </span>
            <strong className="text-white font-mono">₹{totalPurse.toLocaleString('en-IN')}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-800">
            <span className="text-slate-400">Total Deployed: </span>
            <strong className="text-seep-sky font-mono">₹{totalSpent.toLocaleString('en-IN')}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-800">
            <span className="text-slate-400">In Escrow: </span>
            <strong className="text-amber-400 font-mono">₹{totalLocked.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team name or User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filtered.length} of {bidders.length} Teams
        </span>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-navy-900 border border-gold-500/40 text-gold-300 text-xs font-semibold flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-gold-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-navy-800/80">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-navy-950/80 border-b border-navy-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Team Name</th>
              <th className="py-3 px-4">Connection</th>
              <th className="py-3 px-4 text-right">Available Purse</th>
              <th className="py-3 px-4 text-right">In Escrow</th>
              <th className="py-3 px-4 text-right">Total Invested</th>
              <th className="py-3 px-4 text-center">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/90 bg-navy-950/30">
            {filtered.map((b) => {
              const online = isUserOnline(b.id);
              const wallet = b.wallet;

              return (
                <tr key={b.id} className="hover:bg-navy-900/50 transition">
                  <td className="py-3 px-4 font-mono font-black text-white">
                    {b.display_user_id}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-200">
                    {b.team_name}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          online ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                        }`}
                      />
                      <span className={online ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                    ₹{Number(wallet?.available_balance || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                    ₹{Number(wallet?.locked_balance || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-seep-sky">
                    ₹{Number(wallet?.total_spent || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setActivePasswordModalUser(b.id)}
                        title="Reset Password"
                        className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleForceLogout(b.id)}
                        disabled={isProcessing}
                        title="Force Disconnect / Kick Session"
                        className="p-1.5 rounded-lg bg-navy-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(b.id, b.is_active)}
                        disabled={isProcessing}
                        title={b.is_active ? 'Disable Account' : 'Enable Account'}
                        className={`p-1.5 rounded-lg ${
                          b.is_active
                            ? 'bg-emerald-950/40 text-emerald-400 hover:bg-rose-950/60 hover:text-rose-300'
                            : 'bg-rose-950/60 text-rose-400 hover:bg-emerald-950/40 hover:text-emerald-300'
                        } transition`}
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
            })}
          </tbody>
        </table>
      </div>

      {/* Password Reset Modal Popup */}
      {activePasswordModalUser && (
        <div className="p-4 rounded-2xl bg-navy-950 border border-navy-700 space-y-2.5 animate-fade-in shadow-2xl">
          <span className="text-xs font-bold text-white block">
            Update Password for {bidders.find((b) => b.id === activePasswordModalUser)?.team_name}:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl bg-navy-900 border border-navy-700 text-xs text-white placeholder:text-slate-500"
            />
            <button
              onClick={() => handleResetPassword(activePasswordModalUser)}
              className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs shadow-gold transition"
            >
              Update Password
            </button>
            <button
              onClick={() => {
                setActivePasswordModalUser(null);
                setNewPassword('');
              }}
              className="px-4 py-2 rounded-xl bg-navy-800 text-xs font-semibold text-slate-300 hover:bg-navy-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
