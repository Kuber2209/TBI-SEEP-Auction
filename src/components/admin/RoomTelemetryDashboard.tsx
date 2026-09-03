'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BidderWallet, Profile, Startup, AuctionSession, AuctionEvent, Bid } from '@/lib/supabase/types';
import { getLiquidityTier, getTierConfig, LiquidityTier } from './BidderRosterTable';
import {
  Activity,
  ShieldAlert,
  Wifi,
  WifiOff,
  Users,
  Server,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowUpDown,
  Search,
  RefreshCw,
  Fingerprint,
  UploadCloud,
  Check,
  XCircle,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';

interface PingSample {
  id: number;
  timestamp: number;
  latency: number;
  dropped: boolean;
}

interface RoomTelemetryDashboardProps {
  bidders: (Profile & { wallet?: BidderWallet })[];
  startups: Startup[];
  isUserOnline: (userId: string) => boolean;
  onRefresh?: () => void;
  session?: AuctionSession | null;
  events?: AuctionEvent[];
  bids?: Bid[];
}

export function RoomTelemetryDashboard({
  bidders,
  startups,
  isUserOnline,
  onRefresh,
}: RoomTelemetryDashboardProps) {
  // Latency, Packet & Jitter State
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [pingHistory, setPingHistory] = useState<PingSample[]>([]);
  const [packetsSent, setPacketsSent] = useState<number>(0);
  const [packetsDropped, setPacketsDropped] = useState<number>(0);

  // Capital Distribution Map Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | LiquidityTier>('all');
  const [sortBy, setSortBy] = useState<'liquidity' | 'exposure' | 'spent' | 'team'>('liquidity');

  // Cryptographic Snapshot Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [uploadedSnapshot, setUploadedSnapshot] = useState<any | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    computedChecksum: string;
    expectedChecksum: string;
    conserved: boolean;
    schemaVersion: string;
    message: string;
  } | null>(null);

  const sampleCounter = useRef(0);

  // Real-time continuous round-trip ping & packet measurement
  useEffect(() => {
    let isMounted = true;

    const measurePing = async () => {
      const start = performance.now();
      sampleCounter.current += 1;
      const currentSampleId = sampleCounter.current;

      try {
        const response = await fetch('/api/auction/sync', { method: 'HEAD', cache: 'no-store' });
        if (!response.ok && response.status !== 200 && response.status !== 304) {
          throw new Error('Non-200 sync response');
        }
        const elapsed = Math.round(performance.now() - start);

        if (isMounted) {
          setLatencyMs(elapsed);
          setPacketsSent((prev) => prev + 1);
          setPingHistory((prev) => {
            const next = [...prev, { id: currentSampleId, timestamp: Date.now(), latency: elapsed, dropped: false }];
            return next.slice(-24); // Keep last 24 samples
          });
        }
      } catch (e) {
        if (isMounted) {
          setLatencyMs(-1);
          setPacketsSent((prev) => prev + 1);
          setPacketsDropped((prev) => prev + 1);
          setPingHistory((prev) => {
            const next = [...prev, { id: currentSampleId, timestamp: Date.now(), latency: -1, dropped: true }];
            return next.slice(-24);
          });
        }
      }
    };

    measurePing();
    const interval = setInterval(measurePing, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute Jitter (mean absolute difference between consecutive pings)
  const jitterMs = useMemo(() => {
    const validPings = pingHistory.filter((p) => !p.dropped && p.latency >= 0).map((p) => p.latency);
    if (validPings.length < 2) return 0;

    let diffSum = 0;
    for (let i = 1; i < validPings.length; i++) {
      diffSum += Math.abs(validPings[i] - validPings[i - 1]);
    }
    return Number((diffSum / (validPings.length - 1)).toFixed(1));
  }, [pingHistory]);

  // Compute Min, Max, Avg Latency
  const latencyStats = useMemo(() => {
    const validPings = pingHistory.filter((p) => !p.dropped && p.latency >= 0).map((p) => p.latency);
    if (validPings.length === 0) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...validPings);
    const max = Math.max(...validPings);
    const avg = Math.round(validPings.reduce((sum, v) => sum + v, 0) / validPings.length);
    return { min, max, avg };
  }, [pingHistory]);

  const packetDropRate = packetsSent > 0 ? ((packetsDropped / packetsSent) * 100).toFixed(1) : '0.0';

  // Global Ledger Financial Conservation Calculation
  const totalPurse = bidders.reduce((sum, b) => sum + Number(b.wallet?.initial_balance || 50000), 0);
  const totalAvailable = bidders.reduce((sum, b) => sum + Number(b.wallet?.available_balance || 0), 0);
  const totalDeployed = bidders.reduce((sum, b) => sum + Number(b.wallet?.total_spent || 0), 0);
  const totalLocked = bidders.reduce((sum, b) => sum + Number(b.wallet?.locked_balance || 0), 0);
  const onlineBiddersCount = bidders.filter((b) => isUserOnline(b.id)).length;

  const isGlobalConserved =
    bidders.every((b) => {
      const init = Number(b.wallet?.initial_balance || 50000);
      const avail = Number(b.wallet?.available_balance || 0);
      const lock = Number(b.wallet?.locked_balance || 0);
      const spent = Number(b.wallet?.total_spent || 0);
      return init === avail + lock + spent;
    }) && totalPurse === totalAvailable + totalLocked + totalDeployed;

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

  // Filtered & Sorted Bidder Distribution Map
  const filteredBidders = useMemo(() => {
    return bidders
      .filter((b) => {
        const matchesSearch =
          b.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.display_user_id.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (selectedTier !== 'all') {
          const avail = Number(b.wallet?.available_balance || 0);
          const tier = getLiquidityTier(avail);
          if (tier !== selectedTier) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const availA = Number(a.wallet?.available_balance || 0);
        const availB = Number(b.wallet?.available_balance || 0);
        const lockA = Number(a.wallet?.locked_balance || 0);
        const lockB = Number(b.wallet?.locked_balance || 0);
        const spentA = Number(a.wallet?.total_spent || 0);
        const spentB = Number(b.wallet?.total_spent || 0);

        switch (sortBy) {
          case 'liquidity':
            return availB - availA;
          case 'exposure':
            return lockB - lockA;
          case 'spent':
            return spentB - spentA;
          case 'team':
            return a.team_name.localeCompare(b.team_name);
          default:
            return 0;
        }
      });
  }, [bidders, searchTerm, selectedTier, sortBy]);

  const handleDownloadSnapshot = () => {
    window.open('/api/admin/snapshot', '_blank');
  };

  /**
   * Deterministic SHA-256 calculation for client-side snapshot verification
   */
  const canonicalStringify = (obj: any): string => {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return `[${obj.map((item) => canonicalStringify(item)).join(',')}]`;
    }
    const sortedKeys = Object.keys(obj).sort();
    const pairs = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`);
    return `{${pairs.join(',')}}`;
  };

  const handleVerifySnapshotFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setUploadedSnapshot(parsed);

      if (!parsed.metadata || !parsed.data) {
        throw new Error('Invalid snapshot structure: metadata or data section missing');
      }

      const canonicalData = canonicalStringify(parsed.data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(canonicalData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const expectedHash = parsed.metadata.snapshotChecksum || '';
      const isHashMatch = computedHash === expectedHash;

      // Verify wallet conservation from data
      const wallets = parsed.data.wallets || [];
      const isDataConserved = wallets.every((w: any) => {
        const init = Number(w.initial_balance || 0);
        const avail = Number(w.available_balance || 0);
        const lock = Number(w.locked_balance || 0);
        const spent = Number(w.total_spent || 0);
        return init === avail + lock + spent;
      });

      setVerificationResult({
        valid: isHashMatch,
        computedChecksum: computedHash,
        expectedChecksum: expectedHash,
        conserved: isDataConserved,
        schemaVersion: parsed.metadata.schemaVersion || 'unknown',
        message: isHashMatch
          ? 'Cryptographic SHA-256 checksum match. Snapshot is authentic and untampered.'
          : 'CHECKSUM MISMATCH! The snapshot payload data does not match the metadata checksum.',
      });
    } catch (err: any) {
      setVerificationResult({
        valid: false,
        computedChecksum: 'ERROR',
        expectedChecksum: 'N/A',
        conserved: false,
        schemaVersion: 'N/A',
        message: `Verification Error: ${err.message}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: Top Telemetry Ribbon & Cryptographic Controls */}
      <div className="glass-card rounded-[24px] p-6 sm:p-7 border border-white/[0.07] shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[16px] bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Room Telemetry & Risk Command Dashboard</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  LIVE TELEMETRY ACTIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Authoritative venue connectivity, jitter analytics & cryptographic ledger audit
              </p>
            </div>
          </div>

          {/* Action Buttons: Export & Verify Snapshot */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowVerifyModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[12px] bg-navy-900 hover:bg-navy-850 text-xs font-bold text-slate-200 border border-navy-700 hover:border-purple-500/50 shadow-sm transition active:scale-[0.98]"
            >
              <Fingerprint className="w-4 h-4 text-purple-400" />
              <span>Verify Snapshot File</span>
            </button>

            <button
              onClick={handleDownloadSnapshot}
              className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-xs font-black text-navy-950 shadow-sm transition active:scale-[0.98]"
            >
              <FileJson className="w-4 h-4 text-navy-950" />
              <span>Generate Audit Snapshot (.json)</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Ledger Proof Banner */}
        <div className="p-4 rounded-[16px] bg-navy-950/90 border border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-[12px] flex items-center justify-center ${
                isGlobalConserved
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isGlobalConserved ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                  Cryptographic Ledger Status:
                </span>
                <span
                  className={`font-black font-mono px-2 py-0.5 rounded text-[10px] ${
                    isGlobalConserved
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isGlobalConserved ? '100% CONSERVED (v4.0)' : 'CONSERVATION VIOLATION'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Initial Purse (₹{totalPurse.toLocaleString('en-IN')}) = Liquid (₹{totalAvailable.toLocaleString('en-IN')}) + Escrow (₹{totalLocked.toLocaleString('en-IN')}) + Spent (₹{totalDeployed.toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="px-2 py-1 rounded bg-navy-900 border border-white/[0.07]">
              Schema: <strong className="text-white">v4.0</strong>
            </span>
            <span className="px-2 py-1 rounded bg-navy-900 border border-white/[0.07]">
              Audit Engine: <strong className="text-purple-400">SHA-256 Checksum</strong>
            </span>
          </div>
        </div>

        {/* Live Room Latency & Packet Health Monitor */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Round-Trip Ping & WebSocket Health */}
          <div className="p-4 rounded-[16px] bg-navy-950/80 border border-white/[0.07] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Round-Trip Latency</span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  latencyMs >= 0 && latencyMs < 100
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {latencyMs >= 0 ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              </div>
            </div>
            <div className="mt-2">
              <span className="font-semibold text-2xl text-white font-mono">
                {latencyMs >= 0 ? `${latencyMs} ms` : 'Disconnected'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Avg: <strong className="text-white font-mono">{latencyStats.avg}ms</strong> · Min:{' '}
                <strong className="text-emerald-400 font-mono">{latencyStats.min}ms</strong> · Max:{' '}
                <strong className="text-amber-400 font-mono">{latencyStats.max}ms</strong>
              </span>
            </div>
          </div>

          {/* 2. Jitter & Network Variance */}
          <div className="p-4 rounded-[16px] bg-navy-950/80 border border-white/[0.07] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Latency Jitter</span>
              <div className="w-7 h-7 rounded-lg bg-seep-sky/15 text-seep-sky border border-seep-sky/30 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-semibold text-2xl text-seep-sky font-mono">
                ±{jitterMs} ms
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Variance:{' '}
                <strong className={jitterMs < 10 ? 'text-emerald-400' : 'text-amber-400'}>
                  {jitterMs < 10 ? 'Ultra-Stable (<10ms)' : 'Variable'}
                </strong>
              </span>
            </div>
          </div>

          {/* 3. Packet Monitor & Drop Rate */}
          <div className="p-4 rounded-[16px] bg-navy-950/80 border border-white/[0.07] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Packet Drop Rate</span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  packetsDropped === 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-semibold text-2xl text-white font-mono">
                {packetDropRate}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Drops: <strong className="text-slate-300 font-mono">{packetsDropped}</strong> /{' '}
                <strong className="text-slate-400 font-mono">{packetsSent} probes</strong>
              </span>
            </div>
          </div>

          {/* 4. Investor Teams Online Attendance */}
          <div className="p-4 rounded-[16px] bg-navy-950/80 border border-white/[0.07] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Live Presence</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-semibold text-2xl text-emerald-400 font-mono">
                {onlineBiddersCount} / {bidders.length || 15}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Attendance:{' '}
                <strong className="text-white">
                  {((onlineBiddersCount / (bidders.length || 15)) * 100).toFixed(0)}% Room Active
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Latency Sparkline Histogram */}
        <div className="p-4 rounded-[16px] bg-navy-950/60 border border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Recent Ping Latency History (Last {pingHistory.length} Probes)
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> &lt;50ms (Optimal)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> 50-150ms
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt;150ms / Dropped
              </span>
            </div>
          </div>

          <div className="h-10 w-full flex items-end gap-1 pt-2">
            {pingHistory.length === 0 ? (
              <div className="w-full text-center text-slate-600 text-xs py-2 italic font-mono">
                Measuring initial latency telemetry...
              </div>
            ) : (
              pingHistory.map((p) => {
                const heightPct = p.dropped ? 100 : Math.min(100, Math.max(15, (p.latency / 200) * 100));
                const barColor = p.dropped
                  ? 'bg-rose-600'
                  : p.latency < 50
                  ? 'bg-emerald-400'
                  : p.latency < 120
                  ? 'bg-amber-400'
                  : 'bg-rose-400';

                return (
                  <div
                    key={p.id}
                    title={p.dropped ? 'Dropped Packet' : `${p.latency}ms at ${new Date(p.timestamp).toLocaleTimeString()}`}
                    style={{ height: `${heightPct}%` }}
                    className={`flex-1 rounded-t transition-all duration-300 hover:opacity-80 ${barColor}`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Active Bidder Capital Distribution Map */}
      <div className="glass-card rounded-[24px] p-6 sm:p-7 border border-white/[0.07] shadow-sm space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div>
            <h3 className="text-base font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Active Bidder Capital Distribution Map</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-900 border border-navy-700 text-gold-400">
                15 Investor Teams
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live liquidity tiers, active escrow holds, and capital deployment progress
            </p>
          </div>

          {/* Sorting & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search team or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-[12px] bg-navy-950 border border-white/[0.07] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-gold-500 w-44"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-[12px] border border-white/[0.07] text-xs">
              <button
                onClick={() => setSortBy('liquidity')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  sortBy === 'liquidity' ? 'bg-gold-500 text-navy-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Liquidity
              </button>
              <button
                onClick={() => setSortBy('exposure')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  sortBy === 'exposure' ? 'bg-gold-500 text-navy-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Exposure
              </button>
              <button
                onClick={() => setSortBy('spent')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  sortBy === 'spent' ? 'bg-gold-500 text-navy-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Spent
              </button>
              <button
                onClick={() => setSortBy('team')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  sortBy === 'team' ? 'bg-gold-500 text-navy-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Name
              </button>
            </div>
          </div>
        </div>

        {/* Tier Filter Ribbon */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition ${
              selectedTier === 'all'
                ? 'bg-navy-750 text-white border border-slate-600 shadow-sm'
                : 'bg-navy-950 text-slate-400 border border-white/[0.07] hover:text-white'
            }`}
          >
            All Teams ({tierCounts.all})
          </button>
          <button
            onClick={() => setSelectedTier('flush')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition flex items-center gap-1.5 ${
              selectedTier === 'flush'
                ? 'bg-emerald-500 text-navy-950 font-black shadow-sm'
                : 'bg-navy-950 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Flush &gt;₹35k ({tierCounts.flush})</span>
          </button>
          <button
            onClick={() => setSelectedTier('moderate')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition flex items-center gap-1.5 ${
              selectedTier === 'moderate'
                ? 'bg-amber-500 text-navy-950 font-black shadow-sm'
                : 'bg-navy-950 text-amber-400 border border-amber-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Moderate ₹15k-₹35k ({tierCounts.moderate})</span>
          </button>
          <button
            onClick={() => setSelectedTier('critical')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition flex items-center gap-1.5 ${
              selectedTier === 'critical'
                ? 'bg-rose-500 text-white font-black shadow-sm'
                : 'bg-navy-950 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Critical &lt;₹15k ({tierCounts.critical})</span>
          </button>
          <button
            onClick={() => setSelectedTier('depleted')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition flex items-center gap-1.5 ${
              selectedTier === 'depleted'
                ? 'bg-slate-700 text-rose-300 font-black shadow-sm'
                : 'bg-navy-950 text-slate-500 border border-white/[0.07]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Depleted ₹0 ({tierCounts.depleted})</span>
          </button>
        </div>

        {/* 15-Team Grid Map */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBidders.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-slate-500 italic bg-navy-950/40 rounded-[16px] border border-white/[0.07]">
              No investor teams matching selected filter.
            </div>
          ) : (
            filteredBidders.map((b) => {
              const initial = Number(b.wallet?.initial_balance || 50000);
              const available = Number(b.wallet?.available_balance || 0);
              const spent = Number(b.wallet?.total_spent || 0);
              const locked = Number(b.wallet?.locked_balance || 0);
              const isOnline = isUserOnline(b.id);

              const tier = getLiquidityTier(available);
              const tierCfg = getTierConfig(tier);

              const spentPct = Math.min(100, (spent / (initial || 1)) * 100);
              const lockedPct = Math.min(100, (locked / (initial || 1)) * 100);
              const availPct = Math.max(0, 100 - spentPct - lockedPct);

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-[16px] bg-navy-950/70 border transition-all duration-200 hover:border-navy-600 space-y-3 shadow-md ${
                    tier === 'flush'
                      ? 'border-emerald-500/25'
                      : tier === 'moderate'
                      ? 'border-amber-500/25'
                      : tier === 'critical'
                      ? 'border-rose-500/30'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Top Line: Team & Online Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                        }`}
                      />
                      <span className="font-bold text-xs text-white line-clamp-1">
                        {b.team_name}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400 px-2 py-0.5 rounded bg-navy-900 border border-white/[0.07]">
                      {b.display_user_id}
                    </span>
                  </div>

                  {/* Tier & Escrow Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tierCfg.badge}`}>
                      {tier.toUpperCase()} TIER
                    </span>

                    {locked > 0 ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold animate-pulse">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Escrow: ₹{locked.toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">No Escrow Lock</span>
                    )}
                  </div>

                  {/* Liquidity Breakdown Numbers */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-navy-900 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Available Liquidity:</span>
                      <strong className={`text-sm font-black ${tierCfg.text}`}>
                        ₹{available.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total Deployed:</span>
                      <strong className="text-sm font-black text-seep-sky">
                        ₹{spent.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Multi-Segment Spent Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-navy-900 rounded-full overflow-hidden flex border border-white/[0.07] shadow-inner">
                      <div
                        style={{ width: `${spentPct}%` }}
                        title={`Spent: ₹${spent.toLocaleString('en-IN')} (${spentPct.toFixed(0)}%)`}
                        className="bg-seep-sky transition-all duration-300"
                      />
                      <div
                        style={{ width: `${lockedPct}%` }}
                        title={`In Escrow: ₹${locked.toLocaleString('en-IN')} (${lockedPct.toFixed(0)}%)`}
                        className="bg-amber-400 transition-all duration-300"
                      />
                      <div
                        style={{ width: `${availPct}%` }}
                        title={`Available: ₹${available.toLocaleString('en-IN')} (${availPct.toFixed(0)}%)`}
                        className={tier === 'flush' ? 'bg-emerald-500/40' : tier === 'moderate' ? 'bg-amber-500/30' : 'bg-rose-500/30'}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>₹0</span>
                      <span>Purse: ₹{(initial / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 3: Snapshot Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-card rounded-[24px] p-6 sm:p-7 border border-navy-700 shadow-sm space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[16px] bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white uppercase tracking-wider">
                    Cryptographic Snapshot Verifier
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verify SHA-256 state integrity & financial conservation proof
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setUploadedSnapshot(null);
                  setVerificationResult(null);
                }}
                className="p-2 rounded-[12px] bg-navy-900 hover:bg-navy-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* File Upload Trigger */}
            <div className="p-6 rounded-[16px] bg-navy-950 border-2 border-dashed border-white/[0.07] hover:border-purple-500/50 text-center space-y-3 transition">
              <UploadCloud className="w-8 h-8 text-purple-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Upload SEEP 4.0 Snapshot File (.json)</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a generated snapshot to compute client-side SHA-256 digest & verify ledger
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md transition">
                <span>Select Snapshot JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleVerifySnapshotFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Verification Result Display */}
            {verificationResult && (
              <div
                className={`p-4 rounded-[16px] border space-y-3 text-xs ${
                  verificationResult.valid
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {verificationResult.valid ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>CRYPTOGRAPHIC VERIFICATION SUCCESSFUL</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>CRYPTOGRAPHIC VERIFICATION FAILED</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-slate-300">{verificationResult.message}</p>

                <div className="space-y-1.5 pt-2 border-t border-white/[0.07] font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Schema Version:</span>
                    <strong className="text-white">{verificationResult.schemaVersion}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ledger Conservation Equation:</span>
                    <strong className={verificationResult.conserved ? 'text-emerald-400' : 'text-rose-400'}>
                      {verificationResult.conserved ? '✅ 100% Conserved' : '❌ Violation Detected'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Computed SHA-256 Checksum:</span>
                    <strong className="text-purple-300 break-all">{verificationResult.computedChecksum}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Expected SHA-256 Checksum:</span>
                    <strong className="text-slate-300 break-all">{verificationResult.expectedChecksum}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setUploadedSnapshot(null);
                  setVerificationResult(null);
                }}
                className="px-4 py-2 rounded-[12px] bg-navy-900 hover:bg-navy-800 text-xs font-bold text-slate-300"
              >
                Close Verifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

