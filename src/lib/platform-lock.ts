import type { User } from '@supabase/supabase-js'

/**
 * Platform lock — dipakai selama fase "under development" / pemakaian personal.
 *
 * Default-nya TERKUNCI. Platform hanya terbuka kalau PLATFORM_LOCKED di-set
 * eksplisit ke 'false', supaya deploy tanpa env var tidak diam-diam membuka
 * pendaftaran publik kembali.
 */
export function isPlatformLocked(): boolean {
  return process.env.PLATFORM_LOCKED !== 'false'
}

export const LOCK_NOTICE_PATH = '/under-development'

/**
 * Route yang tetap bisa diakses publik selama terkunci.
 *
 * - Halaman notice itu sendiri, kalau tidak redirect-nya jadi loop.
 * - Pintu login + recovery password: registrasi mati, jadi ini cuma dipakai
 *   akun yang sudah ada.
 * - /callback: OAuth Google harus bisa mendarat sebelum sesi terbentuk.
 * - Halaman legal: URL-nya terdaftar di Google OAuth consent screen dan harus
 *   tetap bisa dibuka, kalau tidak verifikasi provider bisa bermasalah.
 * - /api/leads/intake: dipanggil Apps Script (mesin, bukan browser), tidak
 *   pernah punya sesi login. Diamankan sendiri lewat secret header
 *   (LEADS_INTAKE_SECRET), bukan lewat gate ini.
 */
const PUBLIC_PATHS = [
  LOCK_NOTICE_PATH,
  '/login',
  '/forgot-password',
  '/reset-password',
  '/callback',
  '/privacy-policy',
  '/data-deletion',
  '/api/health',
  '/api/leads/intake',
]

/** Registrasi ditutup total selama terkunci, tanpa kecuali. */
const BLOCKED_PATHS = ['/register', '/verify-email']

function allowedEmails(): string[] {
  return (process.env.PLATFORM_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * User yang boleh memakai platform selama terkunci.
 *
 * Kalau PLATFORM_ALLOWED_EMAILS kosong, semua user yang sudah login
 * diizinkan — pintu masuknya tetap tertutup karena registrasi mati.
 */
function isAllowedUser(user: User | null): boolean {
  if (!user) return false

  const allowlist = allowedEmails()
  if (allowlist.length === 0) return true

  return allowlist.includes((user.email ?? '').toLowerCase())
}

function matches(pathname: string, paths: string[]): boolean {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

/**
 * true kalau request harus dibelokkan ke LOCK_NOTICE_PATH.
 */
export function shouldBlockRequest(
  pathname: string,
  user: User | null
): boolean {
  if (!isPlatformLocked()) return false

  if (matches(pathname, BLOCKED_PATHS)) return true
  if (matches(pathname, PUBLIC_PATHS)) return false

  return !isAllowedUser(user)
}
