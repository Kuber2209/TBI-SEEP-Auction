'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { StartupStatus } from '@/lib/supabase/types';

export async function submitBidAction(
  startupId: string,
  amount: number,
  idempotencyKey: string
) {
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)('place_bid', {
    p_startup_id: startupId,
    p_amount: amount,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const msg = error.message.replace(/^ERR_[A-Z_]+:\s*/, '');
    return { success: false, error: msg };
  }

  revalidatePath('/bidder');
  revalidatePath('/admin');
  return { success: true, data };
}

export async function setStageStatusAction(
  startupId: string,
  status: StartupStatus
) {
  const supabase = createClient();

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

  const { data, error } = await (supabase.rpc as any)('reopen_auction', {
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

export async function emergencyPauseAction(sessionId: string) {
  const supabase = createClient();

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

  const { data, error } = await (supabase.rpc as any)('reset_rehearsal_session', {
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

export async function reorderStartupsAction(orderedIds: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    return { success: false, error: 'Forbidden: Admin access required' };
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    return { success: false, error: 'Forbidden: Admin access required' };
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

