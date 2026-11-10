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
    case 'DEGUSTATION': return '/degustatsiya';
    case 'LOGISTICS': return '/logistics';
    case 'WAREHOUSE': return '/warehouse';
    case 'ACCOUNTING': return '/accounting';
    case 'SUPPLY': return '/supply';
    case 'HR': return '/hr';
    case 'SECURITY': return '/security';
    case 'ADMIN': return '/dashboard';
    case 'SUPPLIER': return '/supplier-portal';
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

  // If user is authenticated
  if (isAuthenticated) {
    let userRole = ''
    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'))
      userRole = sessionData.role || ''
    } catch {
      // invalid session cookie
    }

    // Trying to access login page, redirect to their home
    if (pathname === '/login') {
      const targetPath = getRedirectPathForRole(userRole)
      return NextResponse.redirect(new URL(targetPath, request.url))
    }

    // STRICT PRIVACY & ISOLATION FOR SUPPLIER ROLE:
    // Supplier can ONLY access /supplier-portal, nothing else in the enterprise ERP!
    if (userRole === 'SUPPLIER') {
      if (!pathname.startsWith('/supplier-portal')) {
        return NextResponse.redirect(new URL('/supplier-portal', request.url))
      }
    }

    // STRICT PRIVACY & ISOLATION FOR DEGUSTATION ROLE:
    // Degustation/SanPiN department accesses their journals, drivers medical check, chat, and settings
    if (userRole === 'DEGUSTATION') {
      const allowedDegustationPrefixes = ['/degustatsiya', '/drivers-medical', '/chat', '/settings']
      const isAllowed = allowedDegustationPrefixes.some(prefix => pathname.startsWith(prefix))
      if (!isAllowed) {
        return NextResponse.redirect(new URL('/degustatsiya', request.url))
      }
    }
  }

  return NextResponse.next()
}

// Apply middleware to all routes except api, _next/static, _next/image, favicon.ico
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
