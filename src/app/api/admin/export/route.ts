import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Check admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    return new NextResponse('Forbidden: Admin access required', { status: 403 });
  }

  // Fetch all startups with winners
  const { data: startups } = await supabase
    .from('startups')
    .select('*, winner:profiles!winner_team_id(display_user_id, team_name)')
    .order('display_order', { ascending: true });

  // Fetch all bidder wallets
  const { data: wallets } = await supabase
    .from('bidder_wallets')
    .select('*, team:profiles!team_id(display_user_id, team_name)')
    .order('total_spent', { ascending: false });

  // Fetch all bids
  const { data: bids } = await supabase
    .from('bids')
    .select('*, bidder:profiles!bidder_id(display_user_id, team_name), startup:startups!startup_id(name, display_order)')
    .order('server_seq', { ascending: true });

  // Generate CSV Sections
  let csv = '=== SEEP 4.0 GRAND FINALE AUCTION REPORT ===\n';
  csv += `Generated At,${new Date().toISOString()}\n\n`;

  // 1. Startups Allocation Results
  csv += '--- STARTUP LOTS & WINNERS ---\n';
  csv += 'Lot Number,Startup Name,Sector,Base Price (INR),Status,Winning Bid (INR),Winning Team ID,Winning Team Name,Closed At\n';
  (startups || []).forEach((s: any) => {
    csv += `"${s.display_order}","${(s.name || '').replace(/"/g, '""')}","${s.sector}","${s.base_price}","${s.status}","${s.winning_bid_amount || 0}","${s.winner?.display_user_id || 'N/A'}","${(s.winner?.team_name || 'N/A').replace(/"/g, '""')}","${s.closed_at || 'N/A'}"\n`;
  });

  csv += '\n--- BIDDER TEAM FINANCIAL SUMMARY ---\n';
  csv += 'User ID,Team Name,Starting Purse (INR),Available Balance (INR),In Escrow (INR),Total Invested (INR)\n';
  (wallets || []).forEach((w: any) => {
    csv += `"${w.team?.display_user_id || 'N/A'}","${(w.team?.team_name || 'N/A').replace(/"/g, '""')}","${w.initial_balance}","${w.available_balance}","${w.locked_balance}","${w.total_spent}"\n`;
  });

  csv += '\n--- COMPLETE BID TRANSACTION LEDGER ---\n';
  csv += 'Seq,Bid ID,Lot Number,Startup Name,Bidder ID,Bidder Team,Amount (INR),Status,Timestamp\n';
  (bids || []).forEach((b: any) => {
    csv += `"${b.server_seq}","${b.id}","${b.startup?.display_order || 'N/A'}","${(b.startup?.name || 'N/A').replace(/"/g, '""')}","${b.bidder?.display_user_id || 'N/A'}","${(b.bidder?.team_name || 'N/A').replace(/"/g, '""')}","${b.amount}","${b.status}","${b.created_at}"\n`;
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="SEEP_4.0_Auction_Results_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
