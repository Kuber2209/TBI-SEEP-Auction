import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * Public dashboard sync API — no auth required.
 * Returns all data needed by the big-screen display:
 * - session info
 * - all startups (with winner / bidder team names)
 * - active startup details + recent bids on it
 * - leaderboard (teams, lots won, capital spent) — wallet balances intentionally omitted
 */
export async function GET() {
  const supabase = createAdminClient();

  // ── 1. Session ──────────────────────────────────────────────────────────────
  const { data: session } = await supabase
    .from('auction_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const dbSession = session as any;

  if (!dbSession) {
    return NextResponse.json({ error: 'No auction session found' }, { status: 404 });
  }

  const activeStartupId = dbSession?.active_startup_id;

  // ── 2. Run all queries in parallel with Promise.all for minimum backend latency ──
  const [profilesRes, startupsRes, eventsRes, bidsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, team_name, display_user_id')
      .eq('role', 'bidder')
      .eq('is_active', true),

    supabase
      .from('startups')
      .select('*')
      .eq('session_id', dbSession.id)
      .order('display_order', { ascending: true }),

    supabase
      .from('auction_events')
      .select('*')
      .eq('session_id', dbSession.id)
      .order('created_at', { ascending: false })
      .limit(12),

    activeStartupId
      ? supabase
          .from('bids')
          .select('*, bidder_profile:profiles!bidder_id(display_user_id, team_name)')
          .eq('startup_id', activeStartupId)
          .order('server_seq', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  const allProfiles = profilesRes.data || [];
  const rawStartups = startupsRes.data || [];
  const recentEvents = eventsRes.data || [];
  const recentBids = (bidsRes as any).data || [];

  const profileMap = new Map<string, { team_name: string; display_user_id: string }>();
  allProfiles.forEach((p: any) => {
    profileMap.set(p.id, { team_name: p.team_name, display_user_id: p.display_user_id });
  });

  // ── 3. Startups enriched with team names ────────────────────────────────────
  const startups = rawStartups.map((s: any) => ({
    ...s,
    highest_bidder_team_name: s.current_highest_bidder_id
      ? profileMap.get(s.current_highest_bidder_id)?.team_name || null
      : null,
    winner_team_name: s.winner_team_id
      ? profileMap.get(s.winner_team_id)?.team_name || null
      : null,
  }));

  const activeStartup = activeStartupId
    ? startups.find((s) => s.id === activeStartupId) || null
    : null;

  // ── 4. Active lot investor standings ───────────────────────────────────────
  let activeLotLeaderboard: any[] = [];
  if (activeStartup && recentBids.length > 0) {
    const lotMap = new Map<string, {
      teamId: string;
      teamName: string;
      highestBid: number;
      bidCount: number;
      latestBidAt: string;
    }>();

    recentBids.forEach((b: any) => {
      const tid = b.bidder_id;
      const teamName = b.bidder_profile?.team_name || profileMap.get(tid)?.team_name || 'Team';
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
          teamName,
          highestBid: amt,
          bidCount: 1,
          latestBidAt: b.created_at,
        });
      }
    });

    activeLotLeaderboard = Array.from(lotMap.values()).sort((a, b) => b.highestBid - a.highestBid);
  }

  // ── 5. Leaderboard — capital spent + lots won per team (no wallet balances) ─
  const soldStartups = startups.filter((s) => s.status === 'SOLD' && s.winner_team_id);

  const leaderboardMap = new Map<
    string,
    { teamId: string; teamName: string; lotsWon: number; capitalSpent: number }
  >();

  soldStartups.forEach((s: any) => {
    const tid = s.winner_team_id;
    const name = s.winner_team_name || profileMap.get(tid)?.team_name || 'Unknown';
    const existing = leaderboardMap.get(tid);
    if (existing) {
      existing.lotsWon += 1;
      existing.capitalSpent += Number(s.winning_bid_amount || 0);
    } else {
      leaderboardMap.set(tid, {
        teamId: tid,
        teamName: name,
        lotsWon: 1,
        capitalSpent: Number(s.winning_bid_amount || 0),
      });
    }
  });

  // Add teams with 0 wins too so leaderboard shows all active bidders
  allProfiles.forEach((p: any) => {
    if (!leaderboardMap.has(p.id)) {
      leaderboardMap.set(p.id, {
        teamId: p.id,
        teamName: p.team_name,
        lotsWon: 0,
        capitalSpent: 0,
      });
    }
  });

  const leaderboard = Array.from(leaderboardMap.values()).sort((a, b) => {
    if (b.lotsWon !== a.lotsWon) return b.lotsWon - a.lotsWon;
    return b.capitalSpent - a.capitalSpent;
  });

  // ── 6. Session-level stats ──────────────────────────────────────────────────
  const totalCapitalDeployed = soldStartups.reduce(
    (sum: number, s: any) => sum + Number(s.winning_bid_amount || 0),
    0
  );
  const closedLots = startups.filter(
    (s) => s.status === 'SOLD' || s.status === 'UNSOLD'
  ).length;

  return NextResponse.json(
    {
      session: dbSession,
      startups,
      activeStartup,
      recentBids,
      activeLotLeaderboard,
      leaderboard,
      profiles: allProfiles,
      stats: {
        totalLots: startups.length,
        closedLots,
        totalCapitalDeployed,
        activeTeams: allProfiles.length,
      },
      recentEvents,
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Accel-Buffering': 'no',
      },
    }
  );
}
