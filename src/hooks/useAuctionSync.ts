'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuctionSession, Bid, BidderWallet, Profile, Startup } from '@/lib/supabase/types';

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

interface SyncState {
  profile: Profile | null;
  session: AuctionSession | null;
  startups: Startup[];
  activeStartup: Startup | null;
  bids: Bid[];
  wallet: BidderWallet | null;
  wonStartups: Startup[];
  connectionStatus: ConnectionStatus;
  lastSyncedAt: Date | null;
  syncError: string | null;
}

export function useAuctionSync() {
  const [state, setState] = useState<SyncState>({
    profile: null,
    session: null,
    startups: [],
    activeStartup: null,
    bids: [],
    wallet: null,
    wonStartups: [],
    connectionStatus: 'CONNECTING',
    lastSyncedAt: null,
    syncError: null,
  });

  const supabase = createClient();
  const retryCount = useRef(0);
  const isFetching = useRef(false);

  // Authoritative State Fetch
  const fetchAuthoritativeState = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const res = await fetch('/api/auction/sync', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem('seep_session_version');
          window.location.href = '/login?reason=session_revoked';
          return;
        }
        throw new Error(`Sync HTTP error ${res.status}`);
      }

      const data = await res.json();

      // Check session version in sessionStorage
      if (data.profile) {
        const storedVersion = sessionStorage.getItem('seep_session_version');
        const currentVersion = String(data.profile.session_version || 1);

        if (!storedVersion) {
          sessionStorage.setItem('seep_session_version', currentVersion);
        } else if (storedVersion !== currentVersion) {
          sessionStorage.removeItem('seep_session_version');
          window.location.href = '/login?reason=session_kicked';
          return;
        }
      }

      setState(prev => {
        return {
          ...prev,
          profile: data.profile,
          session: data.session,
          startups: data.startups || [],
          activeStartup: data.activeStartup,
          bids: data.recentBids || [],
          wallet: data.wallet,
          wonStartups: data.wonStartups || [],
          connectionStatus: 'CONNECTED',
          lastSyncedAt: new Date(),
          syncError: null,
        };
      });

      retryCount.current = 0;
    } catch (err: any) {
      console.error('State sync failed:', err);
      setState(prev => ({
        ...prev,
        connectionStatus: 'DISCONNECTED',
        syncError: err.message || 'Failed to sync with server',
      }));
    } finally {
      isFetching.current = false;
    }
  }, []);

  // Initial Fetch & Realtime Subscriptions
  useEffect(() => {
    fetchAuthoritativeState();

    // 1. Startups Channel
    const startupsChannel = supabase
      .channel('public:startups')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'startups' },
        () => {
          fetchAuthoritativeState();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setState(prev => ({ ...prev, connectionStatus: 'CONNECTED' }));
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setState(prev => ({ ...prev, connectionStatus: 'DISCONNECTED' }));
        }
      });

    // 2. Bids Channel
    const bidsChannel = supabase
      .channel('public:bids')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids' },
        () => {
          fetchAuthoritativeState();
        }
      )
      .subscribe();

    // 3. Wallets Channel
    const walletsChannel = supabase
      .channel('public:bidder_wallets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bidder_wallets' },
        () => {
          fetchAuthoritativeState();
        }
      )
      .subscribe();

    // 4. Session Channel
    const sessionChannel = supabase
      .channel('public:auction_sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_sessions' },
        () => {
          fetchAuthoritativeState();
        }
      )
      .subscribe();

    // Periodic safety sync every 15 seconds
    const interval = setInterval(() => {
      fetchAuthoritativeState();
    }, 15000);

    return () => {
      supabase.removeChannel(startupsChannel);
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(walletsChannel);
      supabase.removeChannel(sessionChannel);
      clearInterval(interval);
    };
  }, [fetchAuthoritativeState, supabase]);

  // Handle User-specific broadcast for force-logout
  useEffect(() => {
    if (!state.profile?.id) return;

    const userChannel = supabase
      .channel(`private:user:${state.profile.id}`)
      .on('broadcast', { event: 'FORCE_LOGOUT' }, () => {
        sessionStorage.removeItem('seep_session_version');
        window.location.href = '/login?reason=admin_logout';
      })
      .on('broadcast', { event: 'SESSION_INVALIDATED' }, () => {
        sessionStorage.removeItem('seep_session_version');
        window.location.href = '/login?reason=new_session_started';
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [state.profile?.id, supabase]);

  return {
    ...state,
    refresh: fetchAuthoritativeState,
  };
}
