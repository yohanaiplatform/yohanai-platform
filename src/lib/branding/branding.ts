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

/** Posisi watermark di foto listing. */
export const WATERMARK_POSITIONS = [
  { value: "center", label: "Tengah" },
  { value: "top-left", label: "Kiri atas" },
  { value: "bottom-left", label: "Kiri bawah" },
  { value: "top-right", label: "Kanan atas" },
  { value: "bottom-right", label: "Kanan bawah" },
] as const;
export type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number]["value"];

/** Posisi logo di header dokumen. */
export const LOGO_POSITIONS = [
  { value: "left", label: "Atas kiri" },
  { value: "center", label: "Atas tengah" },
  { value: "right", label: "Atas kanan" },
] as const;
export type LogoPosition = (typeof LOGO_POSITIONS)[number]["value"];

export function isWatermarkPosition(v: unknown): v is WatermarkPosition {
  return WATERMARK_POSITIONS.some((p) => p.value === v);
}
export function isLogoPosition(v: unknown): v is LogoPosition {
  return LOGO_POSITIONS.some((p) => p.value === v);
}

export interface Branding {
  watermark: BrandingAsset | null;
  docLogo: BrandingAsset | null;
  /** Default tengah. */
  watermarkPosition: WatermarkPosition;
  /** null = tata letak bawaan masing-masing dokumen (MoU/Kwitansi kiri, PPJB tengah, Laporan kanan). */
  logoPosition: LogoPosition | null;
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
  return {
    watermark: asset(o.watermark),
    docLogo: asset(o.docLogo),
    watermarkPosition: isWatermarkPosition(o.watermarkPosition) ? o.watermarkPosition : "center",
    logoPosition: isLogoPosition(o.logoPosition) ? o.logoPosition : null,
  };
}

export function brandingToJson(b: Branding): Json {
  return { watermark: b.watermark, docLogo: b.docLogo, watermarkPosition: b.watermarkPosition, logoPosition: b.logoPosition } as unknown as Json;
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
