'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuctionSession, Startup } from '@/lib/supabase/types';

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  lotsWon: number;
  capitalSpent: number;
}

export interface DashboardStats {
  totalLots: number;
  closedLots: number;
  totalCapitalDeployed: number;
  activeTeams: number;
}

export interface TickerEvent {
  id: string;
  event_type: string;
  payload: Record<string, any>;
  created_at: string;
}

export interface LotLeaderboardEntry {
  teamId: string;
  teamName: string;
  highestBid: number;
  bidCount: number;
  latestBidAt: string;
}

export interface DashboardState {
  session: AuctionSession | null;
  startups: Startup[];
  activeStartup: Startup | null;
  recentBids: any[];
  activeLotLeaderboard: LotLeaderboardEntry[];
  leaderboard: LeaderboardEntry[];
  stats: DashboardStats;
  recentEvents: TickerEvent[];
  connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  lastSyncedAt: Date | null;
}

const DEFAULT_STATS: DashboardStats = {
  totalLots: 0,
  closedLots: 0,
  totalCapitalDeployed: 0,
  activeTeams: 0,
};

export function useDashboardSync() {
  const [state, setState] = useState<DashboardState>({
    session: null,
    startups: [],
    activeStartup: null,
    recentBids: [],
    activeLotLeaderboard: [],
    leaderboard: [],
    stats: DEFAULT_STATS,
    recentEvents: [],
    connectionStatus: 'CONNECTING',
    lastSyncedAt: null,
  });

  const isFetching = useRef(false);
  const queuedRefetch = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // In-memory cache of team profiles for 0ms optimistic bid-enrichment
  const profilesMapRef = useRef<Record<string, { team_name: string; display_user_id: string }>>({});

  const fetchState = useCallback(async () => {
    if (isFetching.current) {
      queuedRefetch.current = true;
      return;
    }
    isFetching.current = true;
    queuedRefetch.current = false;

    try {
      const res = await fetch('/api/dashboard/sync', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Dashboard sync error ${res.status}`);
      const data = await res.json();

      // Update profiles cache
      if (data.profiles && Array.isArray(data.profiles)) {
        const pMap: Record<string, { team_name: string; display_user_id: string }> = {};
        data.profiles.forEach((p: any) => {
          pMap[p.id] = { team_name: p.team_name, display_user_id: p.display_user_id };
        });
        profilesMapRef.current = pMap;
      }

      setState((prev) => ({
        ...prev,
        session: data.session,
        startups: data.startups || [],
        activeStartup: data.activeStartup,
        recentBids: data.recentBids || [],
        activeLotLeaderboard: data.activeLotLeaderboard || [],
        leaderboard: data.leaderboard || [],
        stats: data.stats || DEFAULT_STATS,
        recentEvents: data.recentEvents || [],
        connectionStatus: 'CONNECTED',
        lastSyncedAt: new Date(),
      }));
    } catch (err) {
      console.error('[Dashboard] Sync failed:', err);
      setState((prev) => ({ ...prev, connectionStatus: 'DISCONNECTED' }));
    } finally {
      isFetching.current = false;
      if (queuedRefetch.current) {
        queuedRefetch.current = false;
        fetchState();
      }
    }
  }, []);

  // Fast 35ms debounce for background DB reconciliation
  const debouncedFetch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(fetchState, 35);
  }, [fetchState]);

  useEffect(() => {
    const supabase = createClient();

    // Initial immediate fetch
    fetchState();

    // ── HIGH-SPEED MULTIPLEXED REALTIME CHANNEL ──────────────────────────────
    const channel = supabase
      .channel('dashboard:realtime_feed')
      // 1. Instant optimistic bid delivery (0ms delay)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        (payload: any) => {
          if (payload?.new && payload.new.id) {
            const rawBid = payload.new;
            const teamProfile = profilesMapRef.current[rawBid.bidder_id];
            const enrichedBid = {
              ...rawBid,
              bidder_profile: teamProfile
                ? { team_name: teamProfile.team_name, display_user_id: teamProfile.display_user_id }
                : { team_name: 'Competing Syndicate', display_user_id: '' },
            };

            setState((prev) => {
              const exists = prev.recentBids.some((b) => b.id === enrichedBid.id);
              const updatedBids = exists
                ? prev.recentBids.map((b) => (b.id === enrichedBid.id ? { ...b, ...enrichedBid } : b))
                : [enrichedBid, ...prev.recentBids];

              let updatedActive = prev.activeStartup;
              if (prev.activeStartup && prev.activeStartup.id === enrichedBid.startup_id) {
                const curHigh = prev.activeStartup.current_highest_bid || 0;
                const newAmt = Number(enrichedBid.amount || 0);
                if (newAmt >= curHigh) {
                  updatedActive = {
                    ...prev.activeStartup,
                    current_highest_bid: newAmt,
                    current_highest_bidder_id: enrichedBid.bidder_id,
                    highest_bidder_team_name:
                      teamProfile?.team_name || prev.activeStartup.highest_bidder_team_name || 'Competing Syndicate',
                  };
                }
              }

              // Instant in-memory re-computation of active lot rankings
              const lotMap = new Map<string, LotLeaderboardEntry>();
              updatedBids.forEach((b: any) => {
                if (updatedActive && b.startup_id === updatedActive.id) {
                  const tid = b.bidder_id;
                  const tname =
                    b.bidder_profile?.team_name ||
                    profilesMapRef.current[tid]?.team_name ||
                    'Team';
                  const amt = Number(b.amount || 0);
                  const existing = lotMap.get(tid);
                  if (existing) {
                    existing.bidCount += 1;
                    if (amt > existing.highestBid) {
                      existing.highestBid = amt;
                      existing.latestBidAt = b.created_at;
                    }
                  } else {
                    lotMap.set(tid, {
                      teamId: tid,
                      teamName: tname,
                      highestBid: amt,
                      bidCount: 1,
                      latestBidAt: b.created_at,
                    });
                  }
                }
              });

              const updatedLotLeaderboard = Array.from(lotMap.values()).sort(
                (a, b) => b.highestBid - a.highestBid
              );

              return {
                ...prev,
                recentBids: updatedBids,
                activeStartup: updatedActive,
                activeLotLeaderboard:
                  updatedLotLeaderboard.length > 0
                    ? updatedLotLeaderboard
                    : prev.activeLotLeaderboard,
                connectionStatus: 'CONNECTED',
                lastSyncedAt: new Date(),
              };
            });
          }
          debouncedFetch();
        }
      )
      // 2. Instant startup lot updates (status, pricing, stage advance)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'startups' },
        (payload: any) => {
          if (payload?.new && payload.new.id) {
            setState((prev) => {
              const updatedStartups = prev.startups.map((s) =>
                s.id === payload.new.id ? { ...s, ...payload.new } : s
              );
              const isActive = Boolean(prev.activeStartup && prev.activeStartup.id === payload.new.id);
              const updatedActive = isActive && prev.activeStartup
                ? { ...prev.activeStartup, ...payload.new }
                : prev.activeStartup;

              return {
                ...prev,
                startups: updatedStartups,
                activeStartup: updatedActive,
                connectionStatus: 'CONNECTED',
                lastSyncedAt: new Date(),
              };
            });
          }
          debouncedFetch();
        }
      )
      // 3. Instant session changes (lot activation, pauses, resets)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_sessions' },
        (payload: any) => {
          if (payload?.new) {
            setState((prev) => {
              const activeId = payload.new.active_startup_id;
              const active = activeId
                ? prev.startups.find((s) => s.id === activeId) || null
                : null;
              return {
                ...prev,
                session: { ...prev.session, ...payload.new },
                activeStartup: active,
                connectionStatus: 'CONNECTED',
                lastSyncedAt: new Date(),
              };
            });
          }
          debouncedFetch();
        }
      )
      // 4. Live ticker & audit stream events
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_events' },
        (payload: any) => {
          if (payload?.new && payload.new.id) {
            setState((prev) => {
              const exists = prev.recentEvents.some((e) => e.id === payload.new.id);
              if (exists) return prev;
              return {
                ...prev,
                recentEvents: [payload.new as TickerEvent, ...prev.recentEvents].slice(0, 12),
              };
            });
          }
          debouncedFetch();
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bidder_wallets' }, () => {
        debouncedFetch();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setState((prev) => ({ ...prev, connectionStatus: 'CONNECTED' }));
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setState((prev) => ({ ...prev, connectionStatus: 'DISCONNECTED' }));
        }
      });

    // ── DIRECT PEER-TO-PEER OPERATOR STAGE BROADCAST CHANNEL ──────────────────
    const stageSignalChannel = supabase
      .channel('auction:stage_signals')
      .on('broadcast', { event: 'STAGE_CHANGED' }, (msg: any) => {
        if (msg?.payload?.new_status === 'WELCOME_LOBBY' || msg?.payload?.startup_id === null) {
          setState((prev) => ({
            ...prev,
            activeStartup: null,
            session: prev.session ? { ...prev.session, active_startup_id: null } : null,
          }));
        } else if (msg?.payload?.startup_id) {
          const sid = msg.payload.startup_id;
          const st = msg.payload.new_status;
          setState((prev) => {
            const updatedStartups = prev.startups.map((s) =>
              s.id === sid ? { ...s, ...(st ? { status: st } : {}) } : s
            );
            const foundActive = updatedStartups.find((s) => s.id === sid) || null;
            return {
              ...prev,
              startups: updatedStartups,
              activeStartup: foundActive,
              session: prev.session ? { ...prev.session, active_startup_id: sid } : null,
            };
          });
        }
        debouncedFetch();
      })
      .subscribe();

    // ── BACKUP POLLING SAFETY NET (every 4s, pauses when tab hidden) ───────────
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') fetchState();
    }, 4000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchState();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
      supabase.removeChannel(stageSignalChannel);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchState, debouncedFetch]);

  return { ...state, refresh: fetchState };
}
