import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/register', '/api/auth/login', '/api/auth/signout']

/** Copy refreshed Supabase auth cookies onto any redirect response */
function redirectWithCookies(supabaseResponse: NextResponse, url: URL): NextResponse {
  const res = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    res.cookies.set(cookie.name, cookie.value, cookie as any)
  })
  return res
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public paths — no auth required
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // Already logged in — send away from auth pages
    if (user && (pathname === '/login' || pathname === '/register')) {
      return redirectWithCookies(supabaseResponse, new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Root redirect
  if (pathname === '/') {
    if (user) return redirectWithCookies(supabaseResponse, new URL('/dashboard', request.url))
    return redirectWithCookies(supabaseResponse, new URL('/login', request.url))
  }

  // Protected routes — require auth
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return redirectWithCookies(supabaseResponse, loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
