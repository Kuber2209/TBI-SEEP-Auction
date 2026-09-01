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

  // 3. Fetch All Startups
  const { data: startups } = await supabase
    .from('startups')
    .select('*')
    .order('display_order', { ascending: true });

  const activeStartupId = (session as any)?.active_startup_id || (startups as any[])?.find(s => ['PRESENTING', 'ACTIVE_BIDDING', 'PAUSED'].includes(s.status))?.id;
  const activeStartup = (startups as any[])?.find(s => s.id === activeStartupId) || (startups as any[])?.[0] || null;

  // 4. Fetch Recent Bids for Active Startup
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

  // 5. Fetch Wallet
  let wallet = null;
  if (userProfile.role === 'bidder') {
    const { data: userWallet } = await supabase
      .from('bidder_wallets')
      .select('*')
      .eq('team_id', user.id)
      .single();
    wallet = userWallet;
  }

  // 6. Fetch Won Items (Portfolio)
  let wonStartups: any[] = [];
  if (userProfile.role === 'bidder') {
    wonStartups = ((startups as any[]) || []).filter(s => s.winner_team_id === user.id && s.status === 'SOLD');
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
