import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST() {
  // 1. Authenticate caller session
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  // 2. Authorize administrator role server-side
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userProfile = profile as any;
  if (!userProfile || userProfile.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Administrator privileges required' },
      { status: 403 }
    );
  }

  try {
    // 3. Privileged seeding executes ONLY after strict authentication & authorization
    const admin = createAdminClient();

    // Create/Ensure Admin Account (ADMIN01)
    const adminEmail = 'admin01@seep.internal';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPassword123!';

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

    // Create 15 Bidder Team Accounts (TEAM01 to TEAM15)
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

    const seededTeams = [];

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

        // Sanitize: do NOT expose passwords in response
        seededTeams.push({ displayId, teamName });
      }
    }

    // Response strictly sanitized: ZERO plaintext credentials returned
    return NextResponse.json({
      success: true,
      message: 'Successfully initialized 15 bidder accounts and administrator.',
      admin: { userId: 'ADMIN01' },
      teams: seededTeams,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to complete seeding operations' },
      { status: 500 }
    );
  }
}
