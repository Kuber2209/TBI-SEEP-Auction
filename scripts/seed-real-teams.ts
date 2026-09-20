import fs from 'node:fs';
import path from 'node:path';

// Load .env.local if present
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
import { normalizeUserIdToEmail } from '../src/lib/auth/utils';

export interface TeamSeedConfig {
  name: string;
  id: string;
  pass: string;
}

export const REAL_TEAMS: TeamSeedConfig[] = [
  { name: 'Bidsians', id: 'bidsians', pass: 'falcon' },
  { name: 'AAA Ventures Pvt. Ltd', id: 'aaa-ven', pass: 'cobalt' },
  { name: 'ALL-IN!!', id: 'all-in', pass: 'matrix' },
  { name: 'Smart Investments', id: 'smart-investments', pass: 'shadow' },
  { name: 'Unicorn Hunters', id: 'unicorn-hunters', pass: 'silver' },
  { name: 'KKG', id: 'kkg', pass: 'vortex' },
  { name: 'BITS Ape Yatch Club', id: 'bits-ape', pass: 'nebula' },
  { name: 'Prestige', id: 'prestige', pass: 'summit' },
  { name: 'Pearson Spectre', id: 'pearson-spectre', pass: 'beacon' },
  { name: 'Bid-cell', id: 'bid-cell', pass: 'zenith' },
  { name: 'pheonix', id: 'pheonix', pass: 'flames' },
  { name: 'Tender Titans', id: 'tender-titans', pass: 'titans' },
  { name: 'Bidatorz', id: 'bidatorz', pass: 'pulsar' },
  { name: 'kbtest', id: 'kbtest', pass: 'rocket' },
];

async function main() {
  console.log('🚀 Seeding 10 Real Bidder Teams into Supabase...');
  const admin = createAdminClient();

  // 1. Fetch all existing Auth users
  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 100 });
  if (usersErr) throw usersErr;

  const existingUsersByEmail = new Map<string, any>();
  usersData.users.forEach((u) => {
    if (u.email) existingUsersByEmail.set(u.email.toLowerCase(), u);
  });

  // 2. Fetch session purse amount
  const { data: session } = await admin
    .from('auction_sessions')
    .select('initial_purse_amount')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const initialPurse = (session as any)?.initial_purse_amount ? Number((session as any).initial_purse_amount) : 100000.0;
  console.log(`💰 Active Session Initial Purse: ₹${initialPurse.toLocaleString('en-IN')}`);

  // 3. Deactivate old mock/test bidder teams
  console.log('🔒 Deactivating legacy rehearsal teams...');
  const dummyIds = [
    'team1', 'team2', 'team3', 'team4',
    'TEAM01', 'TEAM02', 'TEAM03', 'TEAM04', 'TEAM05',
    'TEAM06', 'TEAM07', 'TEAM08', 'TEAM09', 'TEAM10',
    'TEAM11', 'TEAM12', 'TEAM13', 'TEAM14', 'TEAM15',
  ];
  await (admin.from('profiles') as any)
    .update({ is_active: false })
    .in('display_user_id', dummyIds);

  // 4. Provision each of the 10 real teams
  for (const team of REAL_TEAMS) {
    const email = normalizeUserIdToEmail(team.id);
    let userId: string;

    const existingUser = existingUsersByEmail.get(email);
    if (existingUser) {
      console.log(`🔄 Updating existing user: ${team.name} (${email})`);
      userId = existingUser.id;
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        password: team.pass,
        user_metadata: {
          role: 'bidder',
          display_user_id: team.id,
          team_name: team.name,
        },
      });
      if (updErr) console.warn(`   Auth update warning: ${updErr.message}`);
    } else {
      console.log(`✨ Creating new auth user: ${team.name} (${email})`);
      const { data: createData, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: team.pass,
        email_confirm: true,
        user_metadata: {
          role: 'bidder',
          display_user_id: team.id,
          team_name: team.name,
        },
      });
      if (createErr || !createData.user) {
        throw new Error(`Failed creating user for ${team.name}: ${createErr?.message}`);
      }
      userId = createData.user.id;
    }

    // Upsert profile
    const { error: profErr } = await (admin.from('profiles') as any).upsert({
      id: userId,
      display_user_id: team.id,
      team_name: team.name,
      role: 'bidder',
      is_active: true,
      session_version: 1,
      updated_at: new Date().toISOString(),
    });
    if (profErr) {
      throw new Error(`Failed to upsert profile for ${team.name}: ${profErr.message}`);
    }

    // Upsert bidder wallet
    const { error: walletErr } = await (admin.from('bidder_wallets') as any).upsert({
      team_id: userId,
      initial_balance: initialPurse,
      available_balance: initialPurse,
      locked_balance: 0.0,
      total_spent: 0.0,
      updated_at: new Date().toISOString(),
    });
    if (walletErr) {
      throw new Error(`Failed to upsert wallet for ${team.name}: ${walletErr.message}`);
    }

    console.log(`   ✅ Successfully configured: ${team.name} | ID: ${team.id} | Pass: ${team.pass}`);
  }

  console.log('\n🎉 All 10 Bidder Teams successfully provisioned!');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
