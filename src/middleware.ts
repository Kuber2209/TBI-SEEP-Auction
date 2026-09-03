import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // 1. API Route Guards: Authenticated-by-default with RBAC
  if (pathname.startsWith('/api/')) {
    // Explicitly allowlisted public API routes (health checks, webhooks, public telemetry)
    const isPublicApi = pathname === '/api/health' || pathname.startsWith('/api/public/');
    if (isPublicApi) {
      return response;
    }

    // All protected API routes require an authenticated session
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    // Role-based access control for administrative API endpoints
    if (pathname.startsWith('/api/admin/')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.is_active) {
        return NextResponse.json({ error: 'Account inactive or revoked' }, { status: 403 });
      }

      if (profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin privileges required' }, { status: 403 });
      }
    }

    return response;
  }

  // 2. Browser Page Route Guards: Unauthenticated redirect to /login
  if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/bidder'))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Browser Page Role segregation for authenticated users
  if (user) {
    // If on /login or root /, redirect to appropriate panel
    if (pathname === '/login' || pathname === '/') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();

      if (profile && profile.is_active) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = profile.role === 'admin' ? '/admin' : '/bidder';
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Role-based route guards for browser pages
    if (pathname.startsWith('/admin') || pathname.startsWith('/bidder')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.is_active) {
        await supabase.auth.signOut();
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        return NextResponse.redirect(redirectUrl);
      }

      if (pathname.startsWith('/admin') && profile.role !== 'admin') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/bidder';
        return NextResponse.redirect(redirectUrl);
      }

      if (pathname.startsWith('/bidder') && profile.role !== 'bidder') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/admin';
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/login', '/bidder/:path*', '/admin/:path*', '/api/:path*'],
};
