import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/', '/login']
const publicPrefixes = ['/feedback', '/survey']

function getRedirectPathForRole(role?: string) {
  switch (role) {
    case 'DIRECTOR': return '/director';
    case 'QUALITY_CONTROL': return '/dashboard';
    case 'INSPECTOR': return '/inspector';
    case 'TECHNOLOGY': return '/technology';
    case 'PRODUCTION': return '/production';
    case 'KITCHEN': return '/kitchen';
    case 'LOGISTICS': return '/logistics';
    case 'WAREHOUSE': return '/warehouse';
    case 'ACCOUNTING': return '/accounting';
    case 'SUPPLY': return '/supply';
    case 'HR': return '/hr';
    case 'SECURITY': return '/security';
    case 'ADMIN': return '/dashboard';
    default: return '/dashboard';
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if it's an API route or static asset, we typically don't block static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Get the session cookie
  const sessionCookie = request.cookies.get('gp_session')
  const isAuthenticated = !!sessionCookie

  // If user is not authenticated and trying to access a protected route
  const isPublicPrefix = publicPrefixes.some(prefix => pathname.startsWith(prefix))
  if (!isAuthenticated && !publicRoutes.includes(pathname) && !isPublicPrefix) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access login page, redirect to their portal
  if (isAuthenticated && pathname === '/login') {
    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'))
      const targetPath = getRedirectPathForRole(sessionData.role)
      return NextResponse.redirect(new URL(targetPath, request.url))
    } catch {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

// Apply middleware to all routes except api, _next/static, _next/image, favicon.ico
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
