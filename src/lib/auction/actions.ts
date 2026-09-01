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
