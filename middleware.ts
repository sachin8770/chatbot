import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add the routes you want to protect here
const protectedRoutes = ['/profile', '/settings'];

// Add routes that should be inaccessible if already logged in
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  // Get the auth token from the cookies
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Check if it's an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If trying to access a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access login/signup while already logged in, redirect to home
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
