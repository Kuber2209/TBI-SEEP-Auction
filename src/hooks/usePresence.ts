'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/supabase/types';

export interface PresenceUser {
  userId: string;
  displayUserId: string;
  teamName: string;
  role: string;
  onlineAt: string;
}

export function usePresence(currentProfile: Profile | null) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!currentProfile?.id) return;
    const supabase = createClient();

    const presenceChannel = supabase.channel('auction:presence', {
      config: {
        presence: {
          key: currentProfile.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users: PresenceUser[] = [];

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.userId) {
              users.push(p as PresenceUser);
            }
          });
        });

        // Deduplicate
        const uniqueMap = new Map<string, PresenceUser>();
        users.forEach(u => uniqueMap.set(u.userId, u));
        setOnlineUsers(Array.from(uniqueMap.values()));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: currentProfile.id,
            displayUserId: currentProfile.display_user_id,
            teamName: currentProfile.team_name,
            role: currentProfile.role,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentProfile?.id, currentProfile?.display_user_id, currentProfile?.team_name, currentProfile?.role]);

  const bidderCount = onlineUsers.filter(u => u.role === 'bidder').length;
  const isUserOnline = (userId: string) => onlineUsers.some(u => u.userId === userId);

  return {
    onlineUsers,
    bidderCount,
    isUserOnline,
  };
}
