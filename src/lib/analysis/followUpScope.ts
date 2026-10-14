// src/lib/analysis/followUpScope.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Siapa yang melihat daftar tindak lanjut, dari SESI login (bukan input pengguna): admin melihat semua lead (sama seperti
 * RLS), akun lain hanya lead yang ditugaskan kepadanya. null = belum login.
 */
export async function resolveFollowUpScope(supabase: SupabaseClient<Database>): Promise<{ assignedTo: string | null } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin } = await supabase.schema("core").rpc("is_admin_or_above");
  return { assignedTo: isAdmin ? null : user.id };
}
