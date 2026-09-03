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

  const isFetching = useRef(false);
  const queuedRefetch = useRef(false);

  // Authoritative State Fetch from /api/auction/sync
  const fetchAuthoritativeState = useCallback(async () => {
    if (isFetching.current) {
      queuedRefetch.current = true;
      return;
    }
    isFetching.current = true;
    queuedRefetch.current = false;

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
    } catch (err: any) {
      console.error('State sync failed:', err);
      setState(prev => ({
        ...prev,
        connectionStatus: 'DISCONNECTED',
        syncError: err.message || 'Failed to sync with server',
      }));
    } finally {
      isFetching.current = false;
      if (queuedRefetch.current) {
        queuedRefetch.current = false;
        fetchAuthoritativeState();
      }
    }
  }, []);

  // Set up real-time multiplexed WebSocket channel & high-speed backup polling
  useEffect(() => {
    const supabase = createClient();

    // Initial immediate fetch
    fetchAuthoritativeState();

    // Single multiplexed channel for sub-second database change delivery
    const channel = supabase
      .channel('realtime:auction_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'startups' },
        (payload: any) => {
          // Sub-second optimistic update for instant UI responsiveness
          if (payload?.new && payload.new.id) {
            setState(prev => {
              const updatedStartups = prev.startups.map(s =>
                s.id === payload.new.id ? { ...s, ...payload.new } : s
              );
              const active =
                updatedStartups.find(s => s.id === (prev.activeStartup?.id || payload.new.id)) ||
                updatedStartups[0] ||
                null;
              return {
                ...prev,
                startups: updatedStartups,
                activeStartup: active,
                connectionStatus: 'CONNECTED',
                lastSyncedAt: new Date(),
              };
            });
          }
          fetchAuthoritativeState();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        (payload: any) => {
          // Sub-second bid insertion for real-time bid pad / audit stream
          if (payload?.new && payload.new.id) {
            setState(prev => {
              const exists = prev.bids.some(b => b.id === payload.new.id);
              if (!exists) {
                return {
                  ...prev,
                  bids: [payload.new as Bid, ...prev.bids],
                  connectionStatus: 'CONNECTED',
                  lastSyncedAt: new Date(),
                };
              }
              return prev;
            });
          }
          fetchAuthoritativeState();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bidder_wallets' },
        () => {
          fetchAuthoritativeState();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_sessions' },
        (payload: any) => {
          if (payload?.new) {
            setState(prev => ({
              ...prev,
              session: { ...prev.session, ...payload.new },
            }));
          }
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

    // High-frequency backup polling (1500ms) guarantees sub-second convergence
    const interval = setInterval(() => {
      fetchAuthoritativeState();
    }, 1500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchAuthoritativeState]);

  // Private User Channel for force logout broadcasts
  useEffect(() => {
    if (!state.profile?.id) return;
    const supabase = createClient();

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
  }, [state.profile?.id]);

  return {
    ...state,
    refresh: fetchAuthoritativeState,
  };
}
