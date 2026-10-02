// src/lib/reports/getDailyReportRecipients.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface DailyReportRecipient {
  userId: string;
  /** Alamat tujuan aktual -- bisa beda dari email login kalau ada di DAILY_REPORT_EMAIL_OVERRIDES. */
  email: string;
  displayName: string | null;
  /** true = admin/super_admin, laporan tidak di-scope (lihat semua data). */
  isAdmin: boolean;
}

/**
 * DAILY_REPORT_EMAIL_OVERRIDES: daftar "email_login=email_tujuan" dipisah
 * koma. Dipakai untuk admin@yohanai.id -> cvdevthan@gmail.com (Yohan pakai
 * akun admin untuk develop/testing, tapi mau laporan di inbox pribadinya,
 * bukan di admin@yohanai.id yang jarang dicek -- lihat docs/status.mdx).
 */
function parseEmailOverrides(): Map<string, string> {
  const raw = process.env.DAILY_REPORT_EMAIL_OVERRIDES ?? "";
  const map = new Map<string, string>();
  for (const pair of raw.split(",")) {
    const [from, to] = pair.split("=").map((s) => s.trim().toLowerCase());
    if (from && to) map.set(from, to);
  }
  return map;
}

/**
 * Tiap user aktif dengan Daily Report belum dimatikan (opt-out, default
 * aktif -- lihat migration 045). Role admin/super_admin ditandai isAdmin
 * supaya getDailyReport() tahu harus hitung agregat semua data atau
 * di-scope ke assigned_to = userId sendiri.
 */
export async function getDailyReportRecipients(
  supabaseAdmin: SupabaseClient<Database>
): Promise<DailyReportRecipient[]> {
  const overrides = parseEmailOverrides();

  const [{ data: usersPage, error: usersError }, { data: profiles }, { data: roles }, { data: prefs }] =
    await Promise.all([
      supabaseAdmin.auth.admin.listUsers(),
      supabaseAdmin.schema("auth_ext").from("profiles").select("user_id, first_name, last_name, role_id"),
      supabaseAdmin.schema("core").from("roles").select("id, name"),
      supabaseAdmin.schema("auth_ext").from("notification_preferences").select("user_id, daily_report_email"),
    ]);

  if (usersError || !usersPage) return [];

  const roleNameById = new Map((roles ?? []).map((r) => [r.id, r.name]));
  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const prefByUserId = new Map((prefs ?? []).map((p) => [p.user_id, p.daily_report_email]));

  const recipients: DailyReportRecipient[] = [];
  // Dedupe by user id -- ketemu kasus nyata 2 Oktober 2026: listUsers()
  // sempat balikin user yang sama 2x dalam satu panggilan (bukan akun
  // ganda di auth.users, dikonfirmasi lewat query langsung), bikin 1 user
  // dapat Daily Report dobel di inbox-nya.
  const seenUserIds = new Set<string>();

  for (const user of usersPage.users) {
    if (!user.email) continue;
    if (seenUserIds.has(user.id)) continue;
    seenUserIds.add(user.id);

    // Belum pernah simpan preferensi sama sekali -> default aktif (pola
    // sama seperti DEFAULT_PREFS di NotificationPreferencesForm.tsx).
    const wantsReport = prefByUserId.get(user.id) ?? true;
    if (!wantsReport) continue;

    const profile = profileByUserId.get(user.id);
    const roleName = profile?.role_id ? roleNameById.get(profile.role_id) : null;
    const isAdmin = roleName === "admin" || roleName === "super_admin";

    const loginEmail = user.email.toLowerCase();
    const email = overrides.get(loginEmail) ?? user.email;

    const displayName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || null;

    recipients.push({ userId: user.id, email, displayName, isAdmin });
  }

  return recipients;
}
