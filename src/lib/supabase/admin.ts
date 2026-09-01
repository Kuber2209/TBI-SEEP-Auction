import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// WARNING: Service role client must ONLY be used on the server for authorized administrative tasks.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase URL or Service Role Key missing in environment.');
  }

  return createClient<Database>(
    supabaseUrl || 'https://mock.supabase.co',
    serviceRoleKey || 'mock-service-role-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
