import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
    );
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
    );
  }

  return clientInstance;
}
