// middleware.ts
// Protects /developments/admin with HTTP Basic Auth, since this
// standalone app has no login system of its own. Requires an
// ADMIN_PASSWORD env var. Username can be anything (e.g. "fallico").
//
// This is deliberately simple — a shared password for a small
// internal team, not a full user system. Good enough for who's meant
// to use this (you, Frank, Anthony), not meant for a larger org.

import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/developments/admin')) {
    return NextResponse.next();
  }

  const auth = req.headers.get('authorization');
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return new NextResponse('Server misconfigured: ADMIN_PASSWORD not set', { status: 500 });
  }

  if (auth) {
    const [, encoded] = auth.split(' ');
    const decoded = atob(encoded); // atob, not Buffer
    const [, password] = decoded.split(':');
    if (password === expectedPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Fallico Admin"' },
  });
}

export const config = {
  matcher: '/developments/admin/:path*',
};
