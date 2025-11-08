import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // Public routes yang bisa diakses tanpa login
  const publicRoutes = ['/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Auth pages (login, register)
  const authPages = ['/auth/login', '/auth/register']
  const isAuthPage = authPages.some(page => pathname.startsWith(page))

  // Landing page
  const isLandingPage = pathname === '/'

  // Jika user sudah login
  if (token) {
    // Redirect dari landing page ke dashboard
    if (isLandingPage) {
      console.log('[Middleware] 🏠 User sudah login, redirect dari landing page ke dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect dari auth pages (login/register) ke dashboard
    if (isAuthPage) {
      console.log('[Middleware] 🔐 User sudah login, redirect dari auth page ke dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Jika user belum login dan mencoba akses dashboard
  if (!token && pathname.startsWith('/dashboard')) {
    console.log('[Middleware] 🚫 User belum login, redirect ke login page')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Allow request to continue
  return NextResponse.next()
}

// Konfigurasi matcher - routes yang akan diproses middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)',
  ],
}
