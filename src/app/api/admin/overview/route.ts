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

  // 2. Fetch latest audit events
  const { data: events } = await supabase
    .from('auction_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({
    bidders,
    events: events || [],
    serverTime: new Date().toISOString(),
  });
}
