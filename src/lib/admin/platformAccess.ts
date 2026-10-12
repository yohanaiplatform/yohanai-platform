// src/lib/admin/platformAccess.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Boleh membuka halaman Master Admin (/admin)? Admin/super_admin, atau akun yang diberi penanda
 * `auth_ext.profiles.can_view_platform_reports` oleh admin (tanpa peran admin penuh). Pakai client SESI user
 * (bukan service-role): hak diperiksa atas nama pemanggil.
 */
export async function canViewPlatformDashboard(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data: isAdmin } = await supabase.schema("core").rpc("is_admin_or_above");
  if (isAdmin) return true;

  const { data: profile } = await supabase
    .schema("auth_ext")
    .from("profiles")
    .select("can_view_platform_reports")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(profile?.can_view_platform_reports);
}
