import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Deterministic JSON stringification for canonical SHA-256 checksum generation.
 * Sorts object keys recursively to ensure deterministic hash output.
 */
function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalStringify(item)).join(',')}]`;
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`);
  return `{${pairs.join(',')}}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isInline = searchParams.get('inline') === 'true' || searchParams.get('preview') === 'true';

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify Admin privileges
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userProfile = profile as any;

  if (!userProfile || userProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // Fetch full state without arbitrary row limits (full historical retrieval)
  const [
    sessionRes,
    startupsRes,
    walletsRes,
    bidsRes,
    eventsRes,
    fundHoldsRes,
    startupAccountsRes,
  ] = await Promise.all([
    supabase.from('auction_sessions').select('*').single(),
    supabase.from('startups').select('*').order('display_order', { ascending: true }),
    supabase.from('bidder_wallets').select('*, profiles(display_user_id, team_name)').order('total_spent', { ascending: false }),
    supabase.from('bids').select('*, bidder_profile:profiles(display_user_id, team_name)').order('server_seq', { ascending: true }),
    supabase.from('auction_events').select('*').order('created_at', { ascending: true }),
    supabase.from('fund_holds').select('*').order('held_at', { ascending: true }),
    supabase.from('startup_accounts').select('*').order('settled_at', { ascending: true }),
  ]);

  const session = sessionRes.data as any;
  const startups = (startupsRes.data as any[]) || [];
  const wallets = (walletsRes.data as any[]) || [];
  const bids = (bidsRes.data as any[]) || [];
  const events = (eventsRes.data as any[]) || [];
  const fundHolds = (fundHoldsRes.data as any[]) || [];
  const startupAccounts = (startupAccountsRes.data as any[]) || [];

  // Compute Global Financial Conservation: Initial Purse = Available + Locked + Spent across every wallet
  const walletList = wallets;
  let allWalletsConserved = true;
  let totalPurseAllocated = 0;
  let totalAvailableLiquidity = 0;
  let totalEscrowLocked = 0;
  let totalCapitalSpent = 0;

  for (const w of walletList) {
    const initial = Number(w.initial_balance || 0);
    const available = Number(w.available_balance || 0);
    const locked = Number(w.locked_balance || 0);
    const spent = Number(w.total_spent || 0);

    totalPurseAllocated += initial;
    totalAvailableLiquidity += available;
    totalEscrowLocked += locked;
    totalCapitalSpent += spent;

    // Strict conservation equality check
    if (initial !== (available + locked + spent)) {
      allWalletsConserved = false;
    }
  }

  const globalLedgerConservation =
    allWalletsConserved &&
    totalPurseAllocated === (totalAvailableLiquidity + totalEscrowLocked + totalCapitalSpent);

  // Structured state payload for cryptographic hashing
  const dataPayload = {
    session: session || null,
    startups: startups || [],
    wallets: walletList,
    bids: bids || [],
    events: events || [],
    fundHolds: fundHolds || [],
    startupAccounts: startupAccounts || [],
  };

  // Compute SHA-256 cryptographic state checksum over canonical data payload
  const canonicalData = canonicalStringify(dataPayload);
  const snapshotChecksum = crypto.createHash('sha256').update(canonicalData).digest('hex');

  const snapshotTimestamp = new Date().toISOString();

  const snapshot = {
    metadata: {
      eventId: session?.id || 'SEEP_4.0_GRAND_FINALE',
      snapshotTimestamp,
      generatedBy: userProfile.display_user_id || userProfile.id,
      schemaVersion: '4.0',
      snapshotChecksum,
      totalWallets: walletList.length,
      totalLots: (startups || []).length,
      totalBids: (bids || []).length,
      totalEvents: (events || []).length,
      globalLedgerConservation,
      financialSummary: {
        totalPurseAllocated,
        totalAvailableLiquidity,
        totalEscrowLocked,
        totalCapitalSpent,
        conservationDelta: totalPurseAllocated - (totalAvailableLiquidity + totalEscrowLocked + totalCapitalSpent),
      },
    },
    data: dataPayload,
  };

  if (isInline) {
    return NextResponse.json(snapshot, { status: 200 });
  }

  const filename = `SEEP_4.0_Audit_Snapshot_${snapshotChecksum.slice(0, 8)}_${Date.now()}.json`;

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Snapshot-Checksum': snapshotChecksum,
      'X-Schema-Version': '4.0',
    },
  });
}

