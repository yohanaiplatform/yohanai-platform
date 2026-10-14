// src/lib/documents/assignReceiptNumber.ts
//
// Nomor Kwitansi Booking berurutan per tahun per awalan: KW/GDI/2026/001. Dihitung dari semua kwitansi (service-role,
// lintas pengguna) supaya nomor tidak bentrok antar agen.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export async function nextReceiptNumber(admin: SupabaseClient<Database>, prefix: string): Promise<string> {
  const cleanPrefix = prefix.replace(/[^A-Za-z]/g, "").toUpperCase() || "GDI";
  const year = new Date(Date.now() + WIB_OFFSET_MS).getUTCFullYear();
  const like = `KW/${cleanPrefix}/${year}/`;

  const { data } = await admin
    .schema("property")
    .from("documents")
    .select("doc_number")
    .eq("doc_type", "kwitansi_booking")
    .like("doc_number", `${like}%`);
  const max = (data ?? []).reduce((m, r) => {
    const n = Number((r.doc_number ?? "").slice(like.length));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${like}${String(max + 1).padStart(3, "0")}`;
}
