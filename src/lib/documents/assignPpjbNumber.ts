// src/lib/documents/assignPpjbNumber.ts
//
// Nomor PPJB berurutan per kode proyek per tahun: PPJB/KPRMAS/IX/2026/0030 (kode proyek / bulan romawi / tahun / urut).
// Urutan dihitung dari semua PPJB (service-role, lintas pengguna) supaya tidak bentrok.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { romanMonth } from "@/lib/documents/ppjbTypes";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export async function nextPpjbNumber(admin: SupabaseClient<Database>, projectCode: string): Promise<string> {
  const code = projectCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "PPJB";
  const now = new Date(Date.now() + WIB_OFFSET_MS);
  const year = now.getUTCFullYear();
  const month = romanMonth(now.getUTCMonth());

  const { data } = await admin
    .schema("property")
    .from("documents")
    .select("doc_number")
    .eq("doc_type", "ppjb")
    .like("doc_number", `PPJB/${code}/%/${year}/%`);
  const max = (data ?? []).reduce((m, r) => {
    const last = Number((r.doc_number ?? "").split("/").pop());
    return Number.isFinite(last) && last > m ? last : m;
  }, 0);
  return `PPJB/${code}/${month}/${year}/${String(max + 1).padStart(4, "0")}`;
}
