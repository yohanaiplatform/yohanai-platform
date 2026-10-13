// src/lib/documents/assignListingCode.ts
//
// Listing ID resmi (mis. GDI/2026/12): urut per tahun per awalan. Dipanggil server-side (service-role) saat dokumen pertama
// sebuah listing dibuat; listing yang sudah punya kode tidak diubah.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export async function ensureListingCode(
  admin: SupabaseClient<Database>,
  listingId: string,
  prefix: string
): Promise<string | null> {
  const { data: existing } = await admin.schema("property").from("listings").select("listing_code").eq("id", listingId).maybeSingle();
  if (existing?.listing_code) return existing.listing_code;

  const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "GDI";
  const year = new Date(Date.now() + WIB_OFFSET_MS).getUTCFullYear();
  const like = `${cleanPrefix}/${year}/`;

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: rows } = await admin
      .schema("property")
      .from("listings")
      .select("listing_code")
      .like("listing_code", `${like}%`);
    const max = (rows ?? []).reduce((m, r) => {
      const n = Number((r.listing_code ?? "").slice(like.length));
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    const code = `${like}${max + 1 + attempt}`;

    const { error } = await admin
      .schema("property")
      .from("listings")
      .update({ listing_code: code })
      .eq("id", listingId)
      .is("listing_code", null);
    if (!error) return code;
  }
  return null;
}
