import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Verify Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userProfile = profile as any;

  if (!userProfile || userProfile.role !== 'admin') {
    return new NextResponse('Forbidden: Admin access required', { status: 403 });
  }

  // Fetch full state
  const [
    { data: session },
    { data: startups },
    { data: wallets },
    { data: bids },
    { data: events },
  ] = await Promise.all([
    supabase.from('auction_sessions').select('*').single(),
    supabase.from('startups').select('*').order('display_order', { ascending: true }),
    supabase.from('bidder_wallets').select('*, profiles(display_user_id, team_name)').order('total_spent', { ascending: false }),
    supabase.from('bids').select('*').order('server_seq', { ascending: true }),
    supabase.from('auction_events').select('*').order('created_at', { ascending: false }).limit(200),
  ]);

  const snapshot = {
    metadata: {
      eventId: 'SEEP_4.0_GRAND_FINALE',
      snapshotTimestamp: new Date().toISOString(),
      generatedBy: userProfile.display_user_id,
      schemaVersion: '1.0.0',
    },
    session,
    startups,
    wallets,
    bids,
    recentEvents: events,
  };

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="SEEP_4.0_Audit_Snapshot_${Date.now()}.json"`,
    },
  });
}
