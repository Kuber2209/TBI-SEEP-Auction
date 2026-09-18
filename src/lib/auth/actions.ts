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
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Unauthorized. Admin role required.' };
  }

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

export interface CreateBidderTeamInput {
  displayUserId: string;
  teamName: string;
  password: string;
  initialPurse?: number;
}

export interface UpdateBidderTeamInput {
  userId: string;
  displayUserId?: string;
  teamName?: string;
  password?: string;
  isActive?: boolean;
}

export async function createBidderTeamAction(
  input: CreateBidderTeamInput | string,
  teamNameArg?: string,
  passwordArg?: string,
  initialPurseArg?: number
) {
  let displayUserId: string;
  let teamName: string;
  let password: string;
  let rawPurse: any;

  if (typeof input === 'object' && input !== null) {
    displayUserId = input.displayUserId;
    teamName = input.teamName;
    password = input.password;
    rawPurse = input.initialPurse;
  } else {
    displayUserId = input;
    teamName = teamNameArg || '';
    password = passwordArg || '';
    rawPurse = initialPurseArg;
  }

  // 1. Authenticate caller as admin
  const callerProfile = await getCurrentProfile();
  if (!callerProfile || callerProfile.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator privileges required.' };
  }

  // 2. Validate inputs upfront
  const cleanDisplayId = (displayUserId || '').trim().toUpperCase();
  const cleanTeamName = (teamName || '').trim();
  const cleanPassword = (password || '').trim();

  if (!cleanDisplayId) {
    return { success: false, error: 'User ID is required.' };
  }
  if (!/^[A-Z0-9_-]{2,30}$/.test(cleanDisplayId) || !/[A-Z0-9]/.test(cleanDisplayId)) {
    return {
      success: false,
      error: 'User ID must be 2-30 characters containing alphanumeric characters (hyphens and underscores allowed).',
    };
  }
  if (!cleanTeamName) {
    return { success: false, error: 'Team Name is required.' };
  }
  if (cleanTeamName.length > 100) {
    return { success: false, error: 'Team Name must not exceed 100 characters.' };
  }
  if (!cleanPassword || cleanPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const parsedPurse = rawPurse !== undefined ? Number(rawPurse) : 50000;
  if (!Number.isFinite(parsedPurse) || parsedPurse < 0) {
    return { success: false, error: 'Initial purse must be a valid non-negative number.' };
  }
  if (parsedPurse > 1000000000) {
    return { success: false, error: 'Initial purse cannot exceed ₹1,000,000,000.' };
  }
  const purse = Math.round(parsedPurse * 100) / 100;

  const admin = createAdminClient();

  // 3. Check for duplicate display_user_id (with escaped SQL ILIKE wildcards)
  const escapedDisplayId = cleanDisplayId.replace(/([%_\\])/g, '\\$1');
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, display_user_id')
    .ilike('display_user_id', escapedDisplayId)
    .maybeSingle();

  if (existingProfile) {
    return { success: false, error: `User ID "${cleanDisplayId}" already exists.` };
  }

  // 4. Create Supabase Auth user via admin client
  const email = normalizeUserIdToEmail(cleanDisplayId);
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: cleanPassword,
    email_confirm: true,
    user_metadata: { role: 'bidder', display_user_id: cleanDisplayId, team_name: cleanTeamName },
  });

  if (authError || !authData?.user) {
    const errMsg = authError?.message || 'Failed to create bidder auth user.';
    if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('registered')) {
      return { success: false, error: `A team with User ID "${cleanDisplayId}" already exists.` };
    }
    return { success: false, error: errMsg };
  }

  const newUserId = authData.user.id;

  // 5. Insert profiles record (role: 'bidder', is_active: true, session_version: 1)
  const { error: profileError } = await (admin.from('profiles') as any).insert({
    id: newUserId,
    display_user_id: cleanDisplayId,
    team_name: cleanTeamName,
    role: 'bidder',
    is_active: true,
    session_version: 1,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(newUserId).catch(() => {});
    return { success: false, error: profileError.message || 'Failed to insert bidder profile.' };
  }

  // 6. Initialize wallet in bidder_wallets (locked_balance: 0, total_spent: 0)
  const { error: walletError } = await (admin.from('bidder_wallets') as any).insert({
    team_id: newUserId,
    initial_balance: purse,
    available_balance: purse,
    locked_balance: 0,
    total_spent: 0,
  });

  if (walletError) {
    await (admin.from('profiles') as any).delete().eq('id', newUserId).catch(() => {});
    await admin.auth.admin.deleteUser(newUserId).catch(() => {});
    return { success: false, error: walletError.message || 'Failed to initialize bidder wallet.' };
  }

  // 7. Log audit event in account_activity_logs
  try {
    await (admin.from('account_activity_logs') as any).insert({
      user_id: newUserId,
      event_type: 'TEAM_CREATED',
      metadata: {
        initiated_by: callerProfile.id,
        display_user_id: cleanDisplayId,
        team_name: cleanTeamName,
        initial_purse: purse,
      },
    });
  } catch (e) {
    // Non-fatal logging
  }

  // 8. Revalidate /admin cache
  revalidatePath('/admin');
  revalidatePath('/bidder');

  return {
    success: true,
    data: {
      id: newUserId,
      display_user_id: cleanDisplayId,
      team_name: cleanTeamName,
      initial_purse: purse,
    },
  };
}

export async function updateBidderTeamAction(
  input: UpdateBidderTeamInput | string,
  updatesArg?: Partial<UpdateBidderTeamInput>
) {
  let userId: string;
  let displayUserId: string | undefined;
  let teamName: string | undefined;
  let password: string | undefined;
  let isActive: boolean | undefined;

  if (typeof input === 'object' && input !== null) {
    userId = input.userId;
    displayUserId = input.displayUserId;
    teamName = input.teamName;
    password = input.password;
    isActive = input.isActive;
  } else {
    userId = input;
    displayUserId = updatesArg?.displayUserId;
    teamName = updatesArg?.teamName;
    password = updatesArg?.password;
    isActive = updatesArg?.isActive;
  }

  // 1. Authenticate caller as admin
  const callerProfile = await getCurrentProfile();
  if (!callerProfile || callerProfile.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator privileges required.' };
  }

  if (!userId) {
    return { success: false, error: 'Target bidder ID is required.' };
  }

  // 2. Pre-validate ALL inputs upfront BEFORE performing any mutations
  let cleanDisplayId: string | undefined;
  if (displayUserId !== undefined) {
    cleanDisplayId = displayUserId.trim().toUpperCase();
    if (!cleanDisplayId) {
      return { success: false, error: 'User ID cannot be empty.' };
    }
    if (!/^[A-Z0-9_-]{2,30}$/.test(cleanDisplayId) || !/[A-Z0-9]/.test(cleanDisplayId)) {
      return {
        success: false,
        error: 'User ID must be 2-30 characters containing alphanumeric characters (hyphens and underscores allowed).',
      };
    }
  }

  let cleanTeamName: string | undefined;
  if (teamName !== undefined) {
    cleanTeamName = teamName.trim();
    if (!cleanTeamName) {
      return { success: false, error: 'Team Name cannot be empty.' };
    }
    if (cleanTeamName.length > 100) {
      return { success: false, error: 'Team Name must not exceed 100 characters.' };
    }
  }

  let cleanPassword: string | undefined;
  if (password !== undefined && password.trim() !== '') {
    cleanPassword = password.trim();
    if (cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return { success: false, error: 'Invalid active status provided.' };
  }

  const admin = createAdminClient();

  // 3. Guard against modifying non-bidder accounts
  const { data: targetProfile, error: targetError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (targetError || !targetProfile) {
    return { success: false, error: 'Target bidder account not found.' };
  }

  const currentProfile = targetProfile as Profile;
  if (currentProfile.role !== 'bidder') {
    return { success: false, error: 'Forbidden: Only bidder accounts can be modified.' };
  }

  // 4. Duplicate check if User ID is changing (with escaped SQL ILIKE wildcards)
  if (cleanDisplayId !== undefined && cleanDisplayId !== currentProfile.display_user_id) {
    const escapedDisplayId = cleanDisplayId.replace(/([%_\\])/g, '\\$1');
    const { data: dupProfile } = await admin
      .from('profiles')
      .select('id, display_user_id')
      .ilike('display_user_id', escapedDisplayId)
      .neq('id', userId)
      .maybeSingle();

    if (dupProfile) {
      return { success: false, error: `User ID "${cleanDisplayId}" already exists.` };
    }
  }

  // 5. Prepare bundled updates
  const authUpdates: Record<string, any> = {};
  const profileUpdates: Partial<Profile> = {
    updated_at: new Date().toISOString(),
  };
  let shouldInvalidateSession = false;
  const auditMetadata: Record<string, any> = {
    initiated_by: callerProfile.id,
  };

  // User ID / Email update
  if (cleanDisplayId !== undefined && cleanDisplayId !== currentProfile.display_user_id) {
    const newEmail = normalizeUserIdToEmail(cleanDisplayId);
    authUpdates.email = newEmail;
    authUpdates.email_confirm = true;
    profileUpdates.display_user_id = cleanDisplayId;
    auditMetadata.old_display_user_id = currentProfile.display_user_id;
    auditMetadata.new_display_user_id = cleanDisplayId;
    shouldInvalidateSession = true;
  }

  // Team Name update
  if (cleanTeamName !== undefined && cleanTeamName !== currentProfile.team_name) {
    profileUpdates.team_name = cleanTeamName;
    auditMetadata.old_team_name = currentProfile.team_name;
    auditMetadata.new_team_name = cleanTeamName;
  }

  // Synchronize user_metadata in Auth if display_user_id or team_name changed
  const finalDisplayId = profileUpdates.display_user_id || currentProfile.display_user_id;
  const finalTeamName = profileUpdates.team_name || currentProfile.team_name;
  if (profileUpdates.display_user_id || profileUpdates.team_name) {
    authUpdates.user_metadata = {
      role: 'bidder',
      display_user_id: finalDisplayId,
      team_name: finalTeamName,
    };
  }

  // Password update
  if (cleanPassword !== undefined) {
    authUpdates.password = cleanPassword;
    shouldInvalidateSession = true;
    auditMetadata.password_updated = true;
  }

  // Active status toggle
  if (isActive !== undefined && isActive !== currentProfile.is_active) {
    profileUpdates.is_active = isActive;
    auditMetadata.is_active = isActive;
    if (!isActive) {
      shouldInvalidateSession = true;
    }
  }

  // 6. Execute Auth update in a single atomic call if needed
  if (Object.keys(authUpdates).length > 0) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, authUpdates);
    if (authError) {
      const msg = authError.message || 'Failed to update Auth credentials.';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
        return { success: false, error: `User ID "${cleanDisplayId}" or its login email is already registered.` };
      }
      return { success: false, error: msg };
    }
  }

  // 7. Bump session_version immediately if session invalidation is required
  if (shouldInvalidateSession) {
    profileUpdates.session_version = (currentProfile.session_version || 1) + 1;
  }

  // 8. Update database profile record
  const { error: updateProfileError } = await (admin.from('profiles') as any)
    .update(profileUpdates)
    .eq('id', userId);

  if (updateProfileError) {
    // Rollback Auth changes if DB update fails
    if (authUpdates.email || authUpdates.user_metadata) {
      const rollbackAuth: Record<string, any> = {};
      if (authUpdates.email) {
        rollbackAuth.email = normalizeUserIdToEmail(currentProfile.display_user_id);
        rollbackAuth.email_confirm = true;
      }
      rollbackAuth.user_metadata = {
        role: 'bidder',
        display_user_id: currentProfile.display_user_id,
        team_name: currentProfile.team_name,
      };
      await admin.auth.admin.updateUserById(userId, rollbackAuth).catch(() => {});
    }
    return { success: false, error: updateProfileError.message || 'Failed to update profile record.' };
  }

  // 9. Invalidate active sessions
  if (shouldInvalidateSession) {
    try {
      await admin.auth.admin.signOut(userId);
    } catch (e) {
      console.warn('Admin token revocation error on update:', e);
    }
  }

  // 10. Log audit event in account_activity_logs
  try {
    await (admin.from('account_activity_logs') as any).insert({
      user_id: userId,
      event_type: 'TEAM_UPDATED',
      metadata: auditMetadata,
    });
  } catch (e) {
    // Non-fatal logging
  }

  // 11. Revalidate cache
  revalidatePath('/admin');
  revalidatePath('/bidder');

  return { success: true, message: 'Bidder team updated successfully.' };
}
