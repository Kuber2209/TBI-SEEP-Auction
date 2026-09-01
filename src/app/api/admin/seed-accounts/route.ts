import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const admin = createAdminClient();

    // 1. Create Admin Account (ADMIN01)
    const adminEmail = 'admin01@seep.internal';
    const adminPassword = 'AdminPassword123!';

    const { data: adminUser } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: 'admin' },
    });

    if (adminUser?.user) {
      await (admin.from('profiles') as any).upsert({
        id: adminUser.user.id,
        display_user_id: 'ADMIN01',
        team_name: 'Lead Auction Operator',
        role: 'admin',
        is_active: true,
      });
    }

    // 2. Create 15 Bidder Team Accounts (TEAM01 to TEAM15)
    const teamNames = [
      'Team Alpha Venture',
      'Apex Capital',
      'Quantum Syndicate',
      'Vanguard Angels',
      'Horizon Partners',
      'Phoenix Holdings',
      'Nexus Seed Fund',
      'Starlight Investors',
      'Aegis Group',
      'Titan Ventures',
      'Pinnacle Angels',
      'Vector Equity',
      'Solstice Capital',
      'Catalyst Network',
      'Zenith Collective',
    ];

    const createdTeams = [];

    for (let i = 1; i <= 15; i++) {
      const displayId = `TEAM${String(i).padStart(2, '0')}`;
      const email = `${displayId.toLowerCase()}@seep.internal`;
      const password = `Pass${displayId}#2026`;
      const teamName = teamNames[i - 1] || `Investor Team ${i}`;

      const { data: bidderUser } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'bidder' },
      });

      if (bidderUser?.user) {
        await (admin.from('profiles') as any).upsert({
          id: bidderUser.user.id,
          display_user_id: displayId,
          team_name: teamName,
          role: 'bidder',
          is_active: true,
        });

        // Create default wallet
        await (admin.from('bidder_wallets') as any).upsert({
          team_id: bidderUser.user.id,
          initial_balance: 50000.0,
          available_balance: 50000.0,
          locked_balance: 0.0,
          total_spent: 0.0,
        });

        createdTeams.push({ displayId, teamName, password });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully generated 15 bidder accounts and 1 admin account.',
      admin: { userId: 'ADMIN01', password: adminPassword },
      teams: createdTeams,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
