import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await (supabase.rpc as any)('get_auction_state', {
    p_team_id: user.id,
  });

  if (error) {
    if (error.message?.includes('ERR_UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Account inactive or not found' }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

