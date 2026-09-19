'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { StartupStatus } from '@/lib/supabase/types';

async function ensureAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized: Authentication required', user: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    return { ok: false, error: 'Account inactive or revoked', user };
  }

  if (profile.role !== 'admin') {
    return { ok: false, error: 'Forbidden: Admin access required', user };
  }

  return { ok: true, user, profile };
}

export async function submitBidAction(
  startupId: string,
  amount: number,
  idempotencyKey?: string
) {
  if (!startupId) {
    return { success: false, error: 'Target startup ID is required' };
  }
  if (!amount || amount <= 0 || !Number.isFinite(amount)) {
    return { success: false, error: 'A positive numerical bid amount is required' };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required' };

  const validKey = idempotencyKey && idempotencyKey.trim() !== '' ? idempotencyKey : crypto.randomUUID();

  const { data, error } = await (supabase.rpc as any)('place_bid', {
    p_startup_id: startupId,
    p_amount: amount,
    p_idempotency_key: validKey,
  });

  if (error) {
    const msg = error.message.replace(/^ERR_[A-Z_]+:\s*/, '');
    return { success: false, error: msg };
  }

  return { success: true, data };
}

export async function setStageStatusAction(
  startupId: string,
  status: StartupStatus
) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const { data, error } = await (supabase.rpc as any)('set_startup_status', {
    p_startup_id: startupId,
    p_status: status,
  });

  if (error) {
    const msg = error.message.replace(/^ERR_[A-Z_]+:\s*/, '');
    return { success: false, error: msg };
  }

  revalidatePath('/admin');
  revalidatePath('/bidder');
  return { success: true, data };
}

export async function closeAuctionAction(startupId: string) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const { data, error } = await (supabase.rpc as any)('close_auction', {
    p_startup_id: startupId,
  });

  if (error) {
    const msg = error.message.replace(/^ERR_[A-Z_]+:\s*/, '');
    return { success: false, error: msg };
  }

  revalidatePath('/admin');
  revalidatePath('/bidder');
  return { success: true, data };
}

export async function voidBidAction(bidId: string, reason: string) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const { data, error } = await (supabase.rpc as any)('void_bid', {
    p_bid_id: bidId,
    p_reason: reason || 'Administrative adjustment',
  });

  if (error) {
    const msg = error.message.replace(/^ERR_[A-Z_]+:\s*/, '');
    return { success: false, error: msg };
  }

  revalidatePath('/admin');
  revalidatePath('/bidder');
  return { success: true, data };
}

export async function reopenAuctionAction(startupId: string) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const { data, error } = await (supabase.rpc as any)('reopen_auction', {
    p_startup_id: startupId,
  });

  if (error) {
    const msg = error.message.replace(/^ERR_[A-Z_]+:\s*/, '');
    return { success: false, error: msg };
  }

  // Ensure session's active_startup_id is updated to reopened startup
  try {
    const { data: startup } = await (supabase
      .from('startups') as any)
      .select('session_id')
      .eq('id', startupId)
      .single();
    if ((startup as any)?.session_id) {
      await (supabase.from('auction_sessions') as any)
        .update({ active_startup_id: startupId, status: 'ACTIVE' })
        .eq('id', (startup as any).session_id);
    }
  } catch (e) {
    console.error('Failed to update session active startup on reopen:', e);
  }

  revalidatePath('/admin');
  revalidatePath('/bidder');
  return { success: true, data };
}

export async function emergencyPauseAction(sessionId: string) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const { data, error } = await (supabase.rpc as any)('emergency_pause_session', {
    p_session_id: sessionId,
  });

  if (error) {
    const msg = error.message.replace(/^ERR_[A-Z_]+:\s*/, '');
    return { success: false, error: msg };
  }

  revalidatePath('/admin');
  revalidatePath('/bidder');
  return { success: true, data };
}

export async function emergencyResumeAction(sessionId: string) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const { data, error } = await (supabase.rpc as any)('emergency_resume_session', {
    p_session_id: sessionId,
  });

  if (error) {
    const msg = error.message.replace(/^ERR_[A-Z_]+:\s*/, '');
    return { success: false, error: msg };
  }

  revalidatePath('/admin');
  revalidatePath('/bidder');
  return { success: true, data };
}

export async function initializeSessionWalletsAction(sessionId: string) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const { data, error } = await (supabase.rpc as any)('initialize_session_wallets', {
    p_session_id: sessionId,
  });

  if (error) {
    const msg = error.message.replace(/^ERR_[A-Z_]+:\s*/, '');
    return { success: false, error: msg };
  }

  revalidatePath('/admin');
  revalidatePath('/bidder');
  return { success: true, data };
}

export async function resetRehearsalSessionAction(sessionId: string) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const admin = createAdminClient();

    // 1. Fetch startups for this session to get all IDs and identify Lot #1
    const { data: startups, error: startupsErr } = await admin
      .from('startups')
      .select('id, display_order')
      .eq('session_id', sessionId)
      .order('display_order', { ascending: true });

    if (startupsErr) throw startupsErr;

    const startupIds = (startups || []).map((s: any) => s.id);
    const firstStartupId = startups && startups.length > 0 ? (startups[0] as any).id : null;

    if (startupIds.length > 0) {
      // 2. Wipe in strict foreign-key order:
      // A. startup_accounts references bids(id) via winning_bid_id
      await admin.from('startup_accounts').delete().in('startup_id', startupIds);
      // B. fund_holds references bids(id) via bid_id
      await admin.from('fund_holds').delete().in('startup_id', startupIds);
      // C. bids
      await admin.from('bids').delete().in('startup_id', startupIds);
      // D. reset startups back to UPCOMING
      await (admin.from('startups') as any).update({
        status: 'UPCOMING',
        current_highest_bid: null,
        current_highest_bidder_id: null,
        winner_team_id: null,
        winning_bid_amount: null,
        started_presenting_at: null,
        bidding_started_at: null,
        paused_at: null,
        closed_at: null,
        updated_at: new Date().toISOString(),
      }).in('id', startupIds);
    }

    // 3. Clear auction events for this session
    await admin.from('auction_events').delete().eq('session_id', sessionId);

    // 4. Reset all bidder wallets to full initial balance (₹50,000)
    await (admin.from('bidder_wallets') as any).update({
      available_balance: 50000.0,
      initial_balance: 50000.0,
      locked_balance: 0.0,
      total_spent: 0.0,
      updated_at: new Date().toISOString(),
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    // 5. Reset auction session: set ACTIVE status and active_startup_id to first startup (Lot #1)
    await (admin.from('auction_sessions') as any).update({
      status: 'ACTIVE',
      active_startup_id: firstStartupId,
      wallets_initialized: true,
      is_rehearsal: true,
    }).eq('id', sessionId);

    // 6. Log audit event
    try {
      await (admin.from('auction_events') as any).insert({
        session_id: sessionId,
        startup_id: firstStartupId,
        event_type: 'REHEARSAL_RESET',
        actor_id: authCheck.user?.id,
        payload: { firstStartupId, timestamp: new Date().toISOString() },
      });
    } catch (e) {}

    revalidatePath('/admin');
    revalidatePath('/bidder');
    return { success: true, firstStartupId };
  } catch (err: any) {
    console.error('Failed to reset rehearsal session:', err);
    return { success: false, error: err.message || 'Failed to reset rehearsal session' };
  }
}

export async function reorderStartupsAction(orderedIds: string[]) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };
  const user = authCheck.user!;

  if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { success: false, error: 'Valid startup IDs sequence required' };
  }

  // To prevent unique constraint collision on (session_id, display_order):
  // Step 1: Set temporary negative order
  for (let i = 0; i < orderedIds.length; i++) {
    const { error: err1 } = await (supabase.from('startups') as any)
      .update({ display_order: -(i + 1000) })
      .eq('id', orderedIds[i]);
    if (err1) return { success: false, error: err1.message };
  }

  // Step 2: Set final positive sequence 1..N
  for (let i = 0; i < orderedIds.length; i++) {
    const { error: err2 } = await (supabase.from('startups') as any)
      .update({ display_order: i + 1 })
      .eq('id', orderedIds[i]);
    if (err2) return { success: false, error: err2.message };
  }

  // Log audit event
  try {
    await (supabase.from('auction_events') as any).insert({
      event_type: 'STARTUP_REORDERED',
      payload: { ordered_ids: orderedIds },
    });
  } catch (e) {}

  revalidatePath('/admin');
  revalidatePath('/bidder');
  return { success: true };
}

export async function setStageToWelcomeLobbyAction(sessionId: string) {
  const supabase = createClient();
  const authCheck = await ensureAdmin(supabase);
  if (!authCheck.ok) return { success: false, error: authCheck.error };
  const user = authCheck.user!;

  if (!sessionId) {
    return { success: false, error: 'Session ID is required' };
  }

  // Clear active_startup_id on session to put room in Welcome / Standby Lobby mode
  const { error: sessionError } = await (supabase.from('auction_sessions') as any)
    .update({ active_startup_id: null })
    .eq('id', sessionId);

  if (sessionError) return { success: false, error: sessionError.message };

  // Log audit event
  try {
    await (supabase.from('auction_events') as any).insert({
      session_id: sessionId,
      event_type: 'STAGE_SET_WELCOME_LOBBY',
      actor_id: user.id,
      payload: { mode: 'welcome_lobby', timestamp: new Date().toISOString() },
    });
  } catch (e) {}

  revalidatePath('/admin');
  revalidatePath('/bidder');
  return { success: true };
}

