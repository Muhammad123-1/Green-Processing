import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if it's an API route or static asset, we typically don't block static assets
  // But for APIs we might want to block them, let's keep it simple for now
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Get the session cookie
  const sessionCookie = request.cookies.get('gp_session')
  const isAuthenticated = !!sessionCookie

  // If user is not authenticated and trying to access a protected route
  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access login page
  if (isAuthenticated && pathname === '/login') {
    // Ideally we should decode the role and redirect accordingly, 
    // but a general redirect to root (which then handles role redirect) or dashboard is fine.
    // For now, let's redirect to root which will be handled below
    const dashboardUrl = new URL('/', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Handle root route '/'
  if (isAuthenticated && pathname === '/') {
    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'))
      const role = sessionData.role
      
      let targetPath = '/dashboard'
      
      switch (role) {
        case 'DIRECTOR': targetPath = '/director'; break;
        case 'QUALITY_CONTROL': targetPath = '/dashboard'; break; // They use the current system
        case 'TECHNOLOGY': targetPath = '/technology'; break;
        case 'PRODUCTION': targetPath = '/production'; break;
        case 'LOGISTICS': targetPath = '/logistics'; break;
        case 'WAREHOUSE': targetPath = '/warehouse'; break;
        case 'ACCOUNTING': targetPath = '/accounting'; break;
        case 'SUPPLY': targetPath = '/supply'; break;
        case 'HR': targetPath = '/hr'; break;
        case 'SECURITY': targetPath = '/security'; break;
        case 'ADMIN': targetPath = '/dashboard'; break; // Admin goes to main dashboard too
      }
      
      return NextResponse.redirect(new URL(targetPath, request.url))
    } catch {
      // If parsing fails, just go to default
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

// Apply middleware to all routes except api, _next/static, _next/image, favicon.ico
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
