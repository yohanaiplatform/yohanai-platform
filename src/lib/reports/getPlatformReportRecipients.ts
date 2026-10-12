// src/lib/reports/getPlatformReportRecipients.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Penerima Platform Report (email): alamat tetap `PLATFORM_REPORT_RECIPIENT` (atau admin@yohanai.id) PLUS semua akun
 * yang diberi penanda `can_view_platform_reports` oleh admin. Alamat unik (huruf kecil), dikirim satu per satu supaya
 * penerima tidak melihat alamat orang lain.
 */
export async function getPlatformReportRecipients(admin: SupabaseClient<Database>): Promise<string[]> {
  const emails = new Set<string>();
  emails.add((process.env.PLATFORM_REPORT_RECIPIENT || "admin@yohanai.id").trim().toLowerCase());

  const { data: flagged } = await admin
    .schema("auth_ext")
    .from("profiles")
    .select("user_id")
    .eq("can_view_platform_reports", true);

  const ids = new Set((flagged ?? []).map((p) => p.user_id));
  if (ids.size > 0) {
    const { data } = await admin.auth.admin.listUsers();
    for (const user of data?.users ?? []) {
      if (ids.has(user.id) && user.email) emails.add(user.email.toLowerCase());
    }
  }

  return Array.from(emails);
}
