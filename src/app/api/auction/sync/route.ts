import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userProfile = profile as any;

  if (!userProfile || !userProfile.is_active) {
    return NextResponse.json({ error: 'Account inactive or revoked' }, { status: 403 });
  }

  // 2. Fetch Session (Grand Finale)
  const { data: session } = await supabase
    .from('auction_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 3. Fetch all Profiles for fast in-memory team name lookup
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, team_name, display_user_id');

  const profileMap = new Map<string, { team_name: string; display_user_id: string }>();
  (allProfiles || []).forEach((p: any) => {
    profileMap.set(p.id, { team_name: p.team_name, display_user_id: p.display_user_id });
  });

  // 4. Fetch All Startups & Enrich with Team Names
  const { data: rawStartups } = await supabase
    .from('startups')
    .select('*')
    .order('display_order', { ascending: true });

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

  // 5. Fetch Recent Bids for Active Startup
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

  // 6. Fetch Wallet
  let wallet = null;
  if (userProfile.role === 'bidder') {
    const { data: userWallet } = await supabase
      .from('bidder_wallets')
      .select('*')
      .eq('team_id', user.id)
      .single();
    wallet = userWallet;
  }

  // 7. Fetch Won Items (Portfolio)
  let wonStartups: any[] = [];
  if (userProfile.role === 'bidder') {
    wonStartups = (startups || []).filter(
      (s: any) => s.winner_team_id === user.id && s.status === 'SOLD'
    );
  }

  return NextResponse.json({
    profile: userProfile,
    session,
    startups: startups || [],
    activeStartup,
    recentBids,
    wallet,
    wonStartups,
    serverTime: new Date().toISOString(),
  });
}
