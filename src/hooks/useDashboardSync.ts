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

export interface DashboardState {
  session: AuctionSession | null;
  startups: Startup[];
  activeStartup: Startup | null;
  recentBids: any[];
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
    leaderboard: [],
    stats: DEFAULT_STATS,
    recentEvents: [],
    connectionStatus: 'CONNECTING',
    lastSyncedAt: null,
  });

  const isFetching = useRef(false);
  const queuedRefetch = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      setState((prev) => ({
        ...prev,
        session: data.session,
        startups: data.startups || [],
        activeStartup: data.activeStartup,
        recentBids: data.recentBids || [],
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

  const debouncedFetch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(fetchState, 80);
  }, [fetchState]);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    fetchState();

    // Realtime subscriptions — same pattern as useAuctionSync
    const channel = supabase
      .channel('dashboard:realtime_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'startups' }, () => {
        debouncedFetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => {
        debouncedFetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_sessions' }, () => {
        debouncedFetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_events' }, () => {
        debouncedFetch();
      })
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

    // Fallback polling every 8 seconds (WS is primary)
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') fetchState();
    }, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchState();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchState, debouncedFetch]);

  return { ...state, refresh: fetchState };
}
