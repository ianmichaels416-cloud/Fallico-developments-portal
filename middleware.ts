// middleware.ts
// Protects /developments/admin with HTTP Basic Auth. Deliberately
// uses plain Web-standard Request/Response instead of NextRequest/
// NextResponse — importing anything from 'next/server' pulls in an
// internal ua-parser-js dependency that references __dirname, which
// crashes in the Edge runtime middleware runs in (a known Next.js
// bug). Avoiding that import sidesteps it entirely.

export function middleware(req: Request) {
  const url = new URL(req.url);

  if (!url.pathname.startsWith('/developments/admin')) {
    return; // no return value = continue as normal
  }

  const auth = req.headers.get('authorization');
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return new Response('Server misconfigured: ADMIN_PASSWORD not set', { status: 500 });
  }

  if (auth) {
    const [, encoded] = auth.split(' ');
    const decoded = atob(encoded);
    const [, password] = decoded.split(':');
    if (password === expectedPassword) {
      return;
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Fallico Admin"' },
  });
}

export const config = {
  matcher: '/developments/admin/:path*',
};
