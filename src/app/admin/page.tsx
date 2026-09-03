'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuctionSync } from '@/hooks/useAuctionSync';
import { usePresence } from '@/hooks/usePresence';
import { Header } from '@/components/layout/Header';
import { ConnectionBanner } from '@/components/layout/ConnectionBanner';
import { StageControlPanel } from '@/components/admin/StageControlPanel';
import { StartupQueueList } from '@/components/admin/StartupQueueList';
import { BidderRosterTable } from '@/components/admin/BidderRosterTable';
import { RoomTelemetryDashboard } from '@/components/admin/RoomTelemetryDashboard';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { ExportCsvButton } from '@/components/admin/ExportCsvButton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import {
  emergencyPauseAction,
  emergencyResumeAction,
  initializeSessionWalletsAction,
  resetRehearsalSessionAction,
} from '@/lib/auction/actions';
import { Startup, Profile, BidderWallet, AuctionEvent } from '@/lib/supabase/types';
import {
  AlertTriangle,
  Play,
  RotateCcw,
  Coins,
  LayoutDashboard,
  Users,
  ScrollText,
  Radio,
  Loader2,
  Activity,
} from 'lucide-react';

export default function AdminPage() {
  const {
    profile,
    session,
    startups,
    activeStartup: syncedActiveStartup,
    bids,
    connectionStatus,
    refresh: refreshAuctionState,
  } = useAuctionSync();

  const { onlineUsers, bidderCount, isUserOnline } = usePresence(profile);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [activeTab, setActiveTab] = useState<'stage' | 'bidders' | 'telemetry' | 'logs'>('stage');
  const [bidders, setBidders] = useState<(Profile & { wallet?: BidderWallet })[]>([]);
  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [opMessage, setOpMessage] = useState<string | null>(null);

  const activeStartup = selectedStartup || syncedActiveStartup || startups[0] || null;

  // Fetch admin detailed rosters & events
  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.bidders) setBidders(data.bidders);
        if (data.events) setEvents(data.events);
      }
    } catch (e) {
      console.error('Failed to fetch admin overview:', e);
    }
  }, []);

  const handleFullRefresh = useCallback(() => {
    refreshAuctionState();
    fetchAdminData();
  }, [refreshAuctionState, fetchAdminData]);

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000);
    return () => clearInterval(interval);
  }, [fetchAdminData]);

  useEffect(() => {
    if (syncedActiveStartup && !selectedStartup) {
      setSelectedStartup(syncedActiveStartup);
    }
  }, [syncedActiveStartup, selectedStartup]);

  const handleEmergencyToggle = async () => {
    if (!session) return;
    setIsProcessing(true);
    setOpMessage(null);

    try {
      if (session.status === 'PAUSED') {
        const res = await emergencyResumeAction(session.id);
        if (res.success) setOpMessage('Auction session resumed.');
      } else {
        const res = await emergencyPauseAction(session.id);
        if (res.success) setOpMessage('EMERGENCY FREEZE: All auctions and bidding halted.');
      }
      handleFullRefresh();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitWallets = async () => {
    if (!session) return;
    if (!confirm('Initialize wallets for all 15 bidder teams with starting purse?')) return;

    setIsProcessing(true);
    try {
      const res = await initializeSessionWalletsAction(session.id);
      if (res.success) {
        setOpMessage(`Initialized bidder wallets with ₹${session.initial_purse_amount.toLocaleString('en-IN')}`);
        handleFullRefresh();
      } else {
        alert(res.error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetRehearsal = async () => {
    if (!session) return;
    if (!confirm('Reset rehearsal session? This will wipe test bids and restore initial balances.')) return;

    setIsProcessing(true);
    try {
      const res = await resetRehearsalSessionAction(session.id);
      if (res.success) {
        setOpMessage('Rehearsal data successfully reset.');
        handleFullRefresh();
      } else {
        alert(res.error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          <p className="text-sm font-semibold text-slate-300">
            Accessing Operator Control Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Operator Command Center Interface Error">
      <div className="min-h-screen bg-[#ECEFF4] dark:bg-[#030712] flex flex-col justify-between text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <div>
          <ConnectionBanner status={connectionStatus} onRetry={handleFullRefresh} />

          <Header
            profile={profile}
            sessionStatus={session?.status}
            isRehearsal={session?.is_rehearsal}
            onlineCount={bidderCount}
          />

          {/* Emergency Control Ribbon */}
          <div className="bg-white dark:bg-[#0F131D] border-b border-slate-200 dark:border-white/[0.07] px-4 lg:px-8 py-2.5 transition-colors duration-150">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Emergency Pause Button */}
                <button
                  onClick={handleEmergencyToggle}
                  disabled={isProcessing}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition active:scale-[0.98] ${
                    session?.status === 'PAUSED'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>
                    {session?.status === 'PAUSED'
                      ? 'Resume Bidding'
                      : 'Emergency Halt'}
                  </span>
                </button>

                {opMessage && (
                  <span className="text-xs font-medium text-amber-700 dark:text-gold-400 bg-amber-50 dark:bg-gold-500/10 px-2.5 py-1 rounded-md border border-amber-200 dark:border-gold-500/30">
                    {opMessage}
                  </span>
                )}
              </div>

              {/* Quick Operational Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInitWallets}
                  disabled={isProcessing || session?.wallets_initialized}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 disabled:opacity-50 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 flex items-center gap-1.5 transition active:scale-[0.98]"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-gold-400" strokeWidth={1.5} />
                  <span>
                    {session?.wallets_initialized ? 'Wallets Funded' : 'Fund All Wallets'}
                  </span>
                </button>

                {session?.is_rehearsal && (
                  <button
                    onClick={handleResetRehearsal}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-navy-800 dark:hover:bg-purple-900/40 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 flex items-center gap-1.5 transition active:scale-[0.98]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Reset Dry Run</span>
                  </button>
                )}

                <ExportCsvButton />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/[0.07] pb-3">
              <button
                onClick={() => setActiveTab('stage')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'stage'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Live Stage Driver</span>
              </button>

              <button
                onClick={() => setActiveTab('bidders')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'bidders'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Investor Teams ({bidders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'telemetry'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Room Telemetry</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'logs'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Audit Trail</span>
              </button>
            </div>
          </div>

          {/* Main Tab Panels */}
          <main className="max-w-7xl mx-auto p-4 lg:px-8 lg:py-6">
            {activeTab === 'stage' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 4 Cols: Startup Queue */}
                <div className="lg:col-span-4">
                  <StartupQueueList
                    startups={startups}
                    activeStartupId={activeStartup?.id}
                    onSelectStartup={(s) => setSelectedStartup(s)}
                  />
                </div>

                {/* Right 8 Cols: Stage Driver Controls */}
                <div className="lg:col-span-8">
                  <StageControlPanel
                    activeStartup={activeStartup}
                    startups={startups}
                    recentBids={bids}
                    onSelectStartup={(s) => setSelectedStartup(s)}
                    onActionComplete={handleFullRefresh}
                  />
                </div>
              </div>
            )}

            {activeTab === 'bidders' && (
              <BidderRosterTable
                bidders={bidders}
                isUserOnline={isUserOnline}
                onRefresh={handleFullRefresh}
              />
            )}

            {activeTab === 'telemetry' && (
              <RoomTelemetryDashboard
                bidders={bidders}
                startups={startups}
                isUserOnline={isUserOnline}
                onRefresh={handleFullRefresh}
                session={session}
                events={events}
                bids={bids}
              />
            )}

            {activeTab === 'logs' && (
              <AuditLogViewer events={events} onRefresh={handleFullRefresh} />
            )}
          </main>
        </div>

        <footer className="text-center py-4 border-t border-navy-900 text-xs text-slate-500">
          SEEP 4.0 Live Startup Auction Controller · Technology Business Incubator, BITS Pilani Hyderabad
        </footer>
      </div>
    </ErrorBoundary>
  );
}
