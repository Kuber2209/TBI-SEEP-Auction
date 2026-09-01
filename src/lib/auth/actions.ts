'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Profile } from '@/lib/supabase/types';
import { normalizeUserIdToEmail } from './utils';

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return null;
  return profile as Profile;
}

export async function loginWithUserId(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string;
  const password = formData.get('password') as string;

  if (!userId || !password) {
    return { error: 'Please enter both User ID and Password.' };
  }

  const email = normalizeUserIdToEmail(userId);
  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: 'Invalid User ID or Password. Please verify your credentials.' };
  }

  // Check profile & active status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: 'Profile not found. Please contact event administrator.' };
  }

  const userProfile = profile as any;

  if (!userProfile.is_active) {
    await supabase.auth.signOut();
    return { error: 'This team account has been deactivated by the administrator.' };
  }

  // Increment session version to invalidate previous session
  await (supabase.from('profiles') as any)
    .update({ 
      session_version: (userProfile.session_version || 1) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', userProfile.id);

  // Log activity
  try {
    await (supabase.from('account_activity_logs') as any).insert({
      user_id: userProfile.id,
      event_type: 'LOGIN',
      metadata: { role: userProfile.role, display_user_id: userProfile.display_user_id },
    });
  } catch (e) {
    // Non-fatal logging
  }

  revalidatePath('/', 'layout');

  if (userProfile.role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/bidder');
  }
}

export async function logoutAction() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    try {
      await (supabase.from('account_activity_logs') as any).insert({
        user_id: user.id,
        event_type: 'LOGOUT',
        metadata: {},
      });
    } catch (e) {}
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function forceLogoutBidderAction(targetUserId: string) {
  const supabase = createClient();
  const { data, error } = await (supabase.rpc as any)('force_logout_bidder', {
    p_user_id: targetUserId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    const admin = createAdminClient();
    await admin.auth.admin.signOut(targetUserId);
  } catch (e) {
    console.warn('Admin token revocation error:', e);
  }

  revalidatePath('/admin');
  return { success: true, data };
}

export async function resetBidderPasswordAction(targetUserId: string, newPassword: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Unauthorized. Admin role required.' };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (error) throw error;

    const supabase = createClient();
    await (supabase.from('account_activity_logs') as any).insert({
      user_id: targetUserId,
      event_type: 'PASSWORD_RESET',
      metadata: { initiated_by: profile.id },
    });

    revalidatePath('/admin');
    return { success: true, message: 'Password reset successfully' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reset password' };
  }
}

export async function toggleBidderActiveAction(targetUserId: string, isActive: boolean) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Unauthorized. Admin role required.' };
  }

  const supabase = createClient();
  const { error } = await (supabase.from('profiles') as any)
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', targetUserId);

  if (error) {
    return { success: false, error: error.message };
  }

  if (!isActive) {
    await forceLogoutBidderAction(targetUserId);
  }

  revalidatePath('/admin');
  return { success: true };
}
