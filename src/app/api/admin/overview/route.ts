import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin privileges
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // 1. Fetch all bidder profiles joined with their wallets
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, wallet:bidder_wallets!team_id(*)')
    .eq('role', 'bidder')
    .order('display_user_id', { ascending: true });

  const bidders = (profiles || []).map((p: any) => ({
    ...p,
    wallet: Array.isArray(p.wallet) ? p.wallet[0] : p.wallet,
  }));

  // 2. Fetch active session ID to scope audit events
  const { data: activeSession } = await supabase
    .from('auction_sessions')
    .select('id')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 3. Fetch latest audit events scoped to the active session
  let eventsQuery = supabase
    .from('auction_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if ((activeSession as any)?.id) {
    eventsQuery = (eventsQuery as any).eq('session_id', (activeSession as any).id);
  }

  const { data: events } = await eventsQuery;

  return NextResponse.json({
    bidders,
    events: events || [],
    serverTime: new Date().toISOString(),
  });
}
