// src/lib/property/slugify.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Tambah -2, -3, dst kalau slug dasar sudah dipakai listing lain. */
export async function generateUniqueListingSlug(
  supabase: SupabaseClient<Database>,
  title: string
): Promise<string> {
  const base = slugify(title) || "listing";

  const { data } = await supabase
    .schema("property")
    .from("listings")
    .select("slug")
    .like("slug", `${base}%`);

  const existing = new Set((data ?? []).map((row) => row.slug));
  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
