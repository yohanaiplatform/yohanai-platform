import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Client Supabase dengan service role key — bypass RLS sepenuhnya.
 *
 * Hanya untuk dipakai di route handler server-side yang diamankan lewat
 * jalur lain (mis. secret header untuk pemanggil mesin seperti Apps Script),
 * bukan lewat sesi login. Jangan pernah diimpor dari kode yang bisa berjalan
 * di browser — SUPABASE_SERVICE_ROLE_KEY tidak diprefiks NEXT_PUBLIC_ supaya
 * tidak pernah ikut ke bundle client, tapi kesalahan impor tetap bisa lolos
 * saat build kalau file ini dipakai dari komponen client.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
