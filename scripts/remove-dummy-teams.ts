import fs from 'node:fs';
import path from 'node:path';

// Load .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {}

import { createAdminClient } from '../src/lib/supabase/admin';

const DUMMY_IDS = [
  'TEAM01', 'TEAM02', 'TEAM03', 'TEAM04', 'TEAM05',
  'TEAM06', 'TEAM07', 'TEAM08', 'TEAM09', 'TEAM10',
  'TEAM11', 'TEAM12', 'TEAM13', 'TEAM14', 'TEAM15',
  'team1', 'team2', 'team3', 'team4'
];

async function main() {
  console.log('🗑️  Removing all legacy / rehearsal dummy teams...');
  const admin = createAdminClient();

  // 1. Find all dummy profiles
  const { data: dummyProfiles, error: profFetchErr } = await admin
    .from('profiles')
    .select('id, display_user_id, team_name')
    .in('display_user_id', DUMMY_IDS);

  if (profFetchErr) throw profFetchErr;

  const dummyUids = (dummyProfiles || []).map((p: any) => p.id);
  console.log(`Found ${dummyUids.length} dummy profile(s) to remove:`);
  dummyProfiles?.forEach((p: any) => console.log(`   - ${p.display_user_id} (${p.team_name}) [${p.id}]`));

  if (dummyUids.length === 0) {
    console.log('No dummy profiles found in database.');
    return;
  }

  // 2. Unlink any startups referencing these teams as winner or highest bidder
  console.log('Unlinking dummy teams from startups...');
  for (const uid of dummyUids) {
    const { error: sErr } = await (admin.from('startups') as any)
      .update({
        winner_team_id: null,
        winning_bid_amount: null,
        current_highest_bidder_id: null,
        current_highest_bid: null,
        status: 'UPCOMING',
        updated_at: new Date().toISOString(),
      })
      .or(`winner_team_id.eq.${uid},current_highest_bidder_id.eq.${uid}`);
    if (sErr) console.warn('Startup unlink warning:', sErr.message);
  }

  // 3. Find all bid IDs placed by dummy teams
  const { data: dummyBids } = await admin
    .from('bids')
    .select('id')
    .in('bidder_id', dummyUids);

  const dummyBidIds = (dummyBids || []).map((b: any) => b.id);
  console.log(`Found ${dummyBidIds.length} bids placed by dummy teams.`);

  // 4. Delete dependent rows in FK order
  if (dummyBidIds.length > 0) {
    console.log('Deleting startup_accounts referencing dummy bids...');
    const { error: saErr } = await admin.from('startup_accounts').delete().in('winning_bid_id', dummyBidIds);
    if (saErr) console.warn('startup_accounts delete warning:', saErr.message);

    console.log('Deleting fund_holds referencing dummy bids or teams...');
    const { error: fhErr } = await admin.from('fund_holds').delete().in('bid_id', dummyBidIds);
    if (fhErr) console.warn('fund_holds delete warning:', fhErr.message);
  }

  const { error: fhTeamErr } = await admin.from('fund_holds').delete().in('team_id', dummyUids);
  if (fhTeamErr) console.warn('fund_holds team delete warning:', fhTeamErr.message);

  if (dummyBidIds.length > 0) {
    console.log('Deleting bids...');
    const { error: bErr } = await admin.from('bids').delete().in('id', dummyBidIds);
    if (bErr) console.warn('bids delete warning:', bErr.message);
  }

  console.log('Deleting auction_events...');
  await admin.from('auction_events').delete().in('actor_id', dummyUids);
  await admin.from('auction_events').delete().in('target_id', dummyUids);

  console.log('Deleting bidder_wallets...');
  await admin.from('bidder_wallets').delete().in('team_id', dummyUids);

  console.log('Deleting profiles...');
  const { error: delProfErr } = await admin.from('profiles').delete().in('id', dummyUids);
  if (delProfErr) throw delProfErr;

  // 4. Delete Auth users
  console.log('Deleting Supabase Auth users...');
  for (const uid of dummyUids) {
    try {
      await admin.auth.admin.deleteUser(uid);
      console.log(`   ✓ Deleted Auth user: ${uid}`);
    } catch (e: any) {
      console.warn(`   ⚠️ Could not delete auth user ${uid}: ${e.message}`);
    }
  }

  // Also look for any orphaned dummy users in auth.users by email
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 100 });
  const dummyEmails = DUMMY_IDS.map((id) => `${id.toLowerCase()}@seep.internal`);
  for (const u of authUsers?.users || []) {
    if (u.email && dummyEmails.includes(u.email.toLowerCase())) {
      console.log(`   ✓ Deleting orphaned Auth user by email: ${u.email} (${u.id})`);
      await admin.auth.admin.deleteUser(u.id).catch(() => {});
    }
  }

  console.log('\n🎉 All dummy rehearsal teams successfully deleted from database!');
}

main().catch((err) => {
  console.error('❌ Deletion failed:', err);
  process.exit(1);
});
