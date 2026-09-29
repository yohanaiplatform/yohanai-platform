// src/lib/notifications/getAdminUserIds.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface AdminUser {
  userId: string;
  email: string;
}

/**
 * Daftar user berperan admin/super_admin -- dipakai untuk broadcast
 * notifikasi in-app (mis. permintaan akses Google Contacts). Pola query
 * sama seperti getDailyReportRecipients.ts, tapi tidak butuh preferensi
 * notifikasi (notifikasi in-app tidak punya toggle opt-out seperti Daily
 * Report email).
 */
export async function getAdminUserIds(
  supabaseAdmin: SupabaseClient<Database>
): Promise<AdminUser[]> {
  const [{ data: usersPage, error: usersError }, { data: profiles }, { data: roles }] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin.schema("auth_ext").from("profiles").select("user_id, role_id"),
    supabaseAdmin.schema("core").from("roles").select("id, name"),
  ]);

  if (usersError || !usersPage) return [];

  const roleNameById = new Map((roles ?? []).map((r) => [r.id, r.name]));
  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  const admins: AdminUser[] = [];

  for (const user of usersPage.users) {
    if (!user.email) continue;
    const profile = profileByUserId.get(user.id);
    const roleName = profile?.role_id ? roleNameById.get(profile.role_id) : null;
    if (roleName === "admin" || roleName === "super_admin") {
      admins.push({ userId: user.id, email: user.email });
    }
  }

  return admins;
}
