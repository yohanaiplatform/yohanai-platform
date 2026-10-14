// src/lib/branding/branding.ts
//
// Logo/watermark per pengguna. Disimpan di property.document_settings.branding (JSONB, satu baris per pengguna, RLS: hanya
// pemiliknya). Gambar fisik ada di R2 (branding/<userId>/...); halaman/komponen TIDAK memakai URL R2 langsung, melainkan
// proxy same-origin /api/branding/file/<watermark|logo> supaya canvas browser tidak terkena batas CORS.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface BrandingAsset {
  /** URL R2 (atau path statis diawali "/" untuk bawaan). */
  url: string;
  width: number;
  height: number;
  updatedAt: string;
}

export interface Branding {
  watermark: BrandingAsset | null;
  docLogo: BrandingAsset | null;
}

function asset(raw: unknown): BrandingAsset | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.url !== "string" || !o.url) return null;
  return {
    url: o.url,
    width: typeof o.width === "number" ? o.width : 0,
    height: typeof o.height === "number" ? o.height : 0,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : "",
  };
}

export function parseBranding(raw: unknown): Branding {
  const o = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return { watermark: asset(o.watermark), docLogo: asset(o.docLogo) };
}

export function brandingToJson(b: Branding): Json {
  return { watermark: b.watermark, docLogo: b.docLogo } as unknown as Json;
}

export async function getUserBranding(supabase: SupabaseClient<Database>, userId: string): Promise<Branding> {
  const { data } = await supabase.schema("property").from("document_settings").select("branding").eq("user_id", userId).maybeSingle();
  return parseBranding(data?.branding);
}

/** URL logo dokumen untuk <img> (dengan penanda versi agar cache browser ikut berganti), atau null kalau belum diatur. */
export function docLogoUrl(branding: Branding): string | null {
  if (!branding.docLogo) return null;
  return `/api/branding/file/logo?v=${encodeURIComponent(branding.docLogo.updatedAt || "1")}`;
}
