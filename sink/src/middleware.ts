/**
 * Edge-runtime middleware — mirrors nocmon's login-redirect middleware:
 * NextAuth(edge-safe config).auth wrapper + public-path allowlist + a
 * pass-through header rewrite.
 */
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic =
    /^\/api\/(auth|test|diag|ros|rauth|r[0-9]+)(\/|$)/.test(nextUrl.pathname) ||
    nextUrl.pathname.startsWith('/login');

  if (!req.auth && !isPublic) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('next', nextUrl.pathname + nextUrl.search);
    return Response.redirect(loginUrl);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|brand/).*)'],
};
