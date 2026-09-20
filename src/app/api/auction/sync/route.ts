import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Try atomic single-RPC get_auction_state first
  // Note: we still need allSessions for the session switcher, so we fetch them separately
  // and merge into the RPC response when it succeeds.
  try {
    const [rpcResult, sessionsResult] = await Promise.all([
      (supabase.rpc as any)('get_auction_state', { p_team_id: user.id }),
      supabase.from('auction_sessions').select('*').order('created_at', { ascending: false }),
    ]);

    const { data: rpcData, error: rpcError } = rpcResult;
    const allSessionsForRpc = sessionsResult.data || [];

    if (!rpcError && rpcData) {
      // Augment the RPC response with allSessions so the session switcher is populated.
      // Also recompute the primary session using the same ACTIVE-first logic.
      const activeSession = allSessionsForRpc.find((s: any) => s.status === 'ACTIVE') || allSessionsForRpc[0] || rpcData.session;
      return NextResponse.json({
        ...rpcData,
        session: activeSession,
        allSessions: allSessionsForRpc,
      });
    }
  } catch (err) {
    // If RPC is missing or fails, gracefully fall back to multi-query sync below
  }

  // 2. Fallback: Direct authoritative multi-query sync
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userProfile = profile as any;

  if (!userProfile || !userProfile.is_active) {
    return NextResponse.json({ error: 'Account inactive or revoked' }, { status: 403 });
  }

  // Fetch all sessions to support session switcher (mock + real)
  const { data: allSessionsRaw } = await supabase
    .from('auction_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  const allSessions = allSessionsRaw || [];

  // Active session = first ACTIVE one, else the most recently created
  const session = allSessions.find((s: any) => s.status === 'ACTIVE') || allSessions[0] || null;

  // Fetch all Profiles for in-memory team name lookup
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, team_name, display_user_id');

  const profileMap = new Map<string, { team_name: string; display_user_id: string }>();
  (allProfiles || []).forEach((p: any) => {
    profileMap.set(p.id, { team_name: p.team_name, display_user_id: p.display_user_id });
  });

  // Fetch Startups for the ACTIVE session only (prevents mock + real lots mixing)
  const sessionId = (session as any)?.id;
  let rawStartupsQuery = supabase
    .from('startups')
    .select('*')
    .order('display_order', { ascending: true });

  if (sessionId) {
    rawStartupsQuery = (rawStartupsQuery as any).eq('session_id', sessionId);
  }

  const { data: rawStartups } = await rawStartupsQuery;

  const startups = (rawStartups || []).map((s: any) => ({
    ...s,
    highest_bidder_team_name: s.current_highest_bidder_id
      ? profileMap.get(s.current_highest_bidder_id)?.team_name || null
      : null,
    winner_team_name: s.winner_team_id
      ? profileMap.get(s.winner_team_id)?.team_name || null
      : null,
  }));

  const activeStartupId = (session as any)?.active_startup_id;
  const activeStartup = activeStartupId
    ? (startups as any[])?.find((s) => s.id === activeStartupId) || null
    : null;

  // Fetch Recent Bids for Active Startup
  let recentBids: any[] = [];
  if (activeStartup) {
    const { data: bids } = await supabase
      .from('bids')
      .select('*, bidder_profile:profiles!bidder_id(display_user_id, team_name)')
      .eq('startup_id', activeStartup.id)
      .order('server_seq', { ascending: false })
      .limit(30);

    recentBids = bids || [];
  }

  // Fetch Wallet
  let wallet = null;
  if (userProfile.role === 'bidder') {
    const { data: userWallet } = await supabase
      .from('bidder_wallets')
      .select('*')
      .eq('team_id', user.id)
      .single();
    wallet = userWallet;
  }

  // Fetch Won Items (Portfolio)
  let wonStartups: any[] = [];
  if (userProfile.role === 'bidder') {
    wonStartups = (startups || []).filter(
      (s: any) => s.winner_team_id === user.id && s.status === 'SOLD'
    );
  }

  return NextResponse.json({
    profile: userProfile,
    session,
    allSessions,
    startups: startups || [],
    activeStartup,
    recentBids,
    wallet,
    wonStartups,
    serverTime: new Date().toISOString(),
  });
}
