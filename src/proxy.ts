import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 mengganti konvensi `middleware` menjadi `proxy`. File ini harus
// berada di dalam `src/`, sejajar dengan `app/` — kalau ditaruh di root project
// (seperti `middleware.ts` sebelumnya) Next mengabaikannya tanpa peringatan.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
