'use client';

import React, { useState } from 'react';
import {
  forceLogoutBidderAction,
  resetBidderPasswordAction,
  toggleBidderActiveAction,
} from '@/lib/auth/actions';
import { BidderWallet, Profile } from '@/lib/supabase/types';
import { Users, LogOut, KeyRound, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

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
  const [activePasswordModalUser, setActivePasswordModalUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleForceLogout = async (userId: string) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await forceLogoutBidderAction(userId);
      if (res.success) {
        setStatusMessage('Bidder successfully forced to log out.');
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
    <div className="glass-card rounded-2xl p-5 border border-navy-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-seep-sky" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Bidder Accounts & Financial Roster
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {bidders.length} Registered Teams
        </span>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-navy-900 border border-gold-500/40 text-gold-300 text-xs font-medium">
          {statusMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-navy-800 text-slate-400 uppercase text-[10px] font-bold">
              <th className="py-2.5 px-3">User ID</th>
              <th className="py-2.5 px-3">Team Name</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Available Purse</th>
              <th className="py-2.5 px-3 text-right">In Escrow</th>
              <th className="py-2.5 px-3 text-right">Total Invested</th>
              <th className="py-2.5 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900">
            {bidders.map((b) => {
              const online = isUserOnline(b.id);
              const wallet = b.wallet;

              return (
                <tr key={b.id} className="hover:bg-navy-900/40 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-white">
                    {b.display_user_id}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    {b.team_name}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                        }`}
                      />
                      <span className={online ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    ₹{Number(wallet?.available_balance || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                    ₹{Number(wallet?.locked_balance || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-seep-sky">
                    ₹{Number(wallet?.total_spent || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Password Reset */}
                      <button
                        onClick={() => setActivePasswordModalUser(b.id)}
                        title="Reset Password"
                        className="p-1.5 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      {/* Force Logout */}
                      <button
                        onClick={() => handleForceLogout(b.id)}
                        disabled={isProcessing}
                        title="Force Disconnect / Kick Session"
                        className="p-1.5 rounded bg-navy-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleActive(b.id, b.is_active)}
                        disabled={isProcessing}
                        title={b.is_active ? 'Disable Account' : 'Enable Account'}
                        className={`p-1.5 rounded ${
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

      {/* Password Reset Popup */}
      {activePasswordModalUser && (
        <div className="p-3 rounded-xl bg-navy-950 border border-navy-700 space-y-2">
          <span className="text-xs font-bold text-white block">
            Set New Password for {bidders.find((b) => b.id === activePasswordModalUser)?.team_name}:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter new password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded bg-navy-900 border border-navy-700 text-xs text-white"
            />
            <button
              onClick={() => handleResetPassword(activePasswordModalUser)}
              className="px-3 py-1.5 rounded bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs"
            >
              Update Password
            </button>
            <button
              onClick={() => {
                setActivePasswordModalUser(null);
                setNewPassword('');
              }}
              className="px-3 py-1.5 rounded bg-navy-800 text-xs text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
