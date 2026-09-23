import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { LOCK_NOTICE_PATH, shouldBlockRequest } from '@/lib/platform-lock'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
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

  if (shouldBlockRequest(request.nextUrl.pathname, user)) {
    const lockRedirect = NextResponse.redirect(
      new URL(LOCK_NOTICE_PATH, request.url)
    )

    // Bawa cookie hasil refresh sesi ikut ke response redirect, kalau tidak
    // sesi yang baru saja di-refresh hilang setiap kali user kena gate.
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => lockRedirect.cookies.set(cookie))

    return lockRedirect
  }

  return supabaseResponse
}