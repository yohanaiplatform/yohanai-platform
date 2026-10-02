// src/lib/crm/slugify.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Tambah -2, -3, dst kalau slug dasar sudah dipakai lead lain -- pola sama
 * seperti generateUniqueListingSlug() di src/lib/property/slugify.ts.
 * Dipanggil saat lead BARU dibuat (createLead.ts, /api/leads/intake);
 * slug lead yang sudah ada TIDAK diregenerasi kalau namanya diedit lagi
 * nanti (termasuk oleh AI Agent lewat confirmedName) -- supaya link yang
 * sudah dibagikan/disimpan (notifikasi, dsb) tetap valid.
 */
export async function generateUniqueLeadSlug(
  supabase: SupabaseClient<Database>,
  firstName: string,
  lastName: string
): Promise<string> {
  const base = slugify(`${firstName} ${lastName}`) || "lead";

  const { data } = await supabase
    .schema("customer")
    .from("leads")
    .select("slug")
    .like("slug", `${base}%`);

  const existing = new Set((data ?? []).map((row) => row.slug));
  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
