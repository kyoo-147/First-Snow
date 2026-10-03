import { type NextRequest, NextResponse } from 'next/server';
import {
  verifyParentSession,
  verifyChildSession,
  PARENT_COOKIE_NAME,
  CHILD_COOKIE_NAME,
} from '@/lib/auth/session';

const ADMIN_ROUTES = ['/admin'];
const PARENT_ROUTES = ['/parent'];
const CHILD_ROUTES = ['/session', '/companion', '/lessons', '/activities', '/rewards'];

/**
 * Next.js 16 Proxy route guard (formerly middleware.ts).
 * Runs on the server to protect parent, child, and admin routes.
 */
export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // 1. Admin route guard: require admin role
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    const parentToken = req.cookies.get(PARENT_COOKIE_NAME)?.value;
    if (!parentToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const payload = await verifyParentSession(parentToken);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  }

  // 2. Parent route guard: require parent or admin role
  if (PARENT_ROUTES.some((route) => pathname.startsWith(route))) {
    const parentToken = req.cookies.get(PARENT_COOKIE_NAME)?.value;
    if (!parentToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const payload = await verifyParentSession(parentToken);
    if (!payload) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  }

  // 3. Child route guard: require valid child session
  if (CHILD_ROUTES.some((route) => pathname.startsWith(route))) {
    const childToken = req.cookies.get(CHILD_COOKIE_NAME)?.value;
    if (!childToken) {
      return NextResponse.redirect(new URL('/child-login', req.url));
    }

    const payload = await verifyChildSession(childToken);
    if (!payload) {
      return NextResponse.redirect(new URL('/child-login', req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// Backward-compatible exports
export { proxy as middleware };
export default proxy;

export const config = {
  matcher: [
    '/admin/:path*',
    '/parent/:path*',
    '/session/:path*',
    '/companion/:path*',
    '/lessons/:path*',
    '/activities/:path*',
    '/rewards/:path*',
  ],
};
