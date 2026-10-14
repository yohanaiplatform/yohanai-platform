// src/app/api/branding/upload/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2, r2KeyFromUrl, uploadToR2 } from "@/lib/storage/r2";
import { readImageInfo } from "@/lib/branding/imageInfo";
import { BRANDING_SPECS, validateBrandingImage, type BrandingKind } from "@/lib/branding/spec";
import { brandingToJson, getUserBranding } from "@/lib/branding/branding";

/**
 * Unggah logo dokumen atau watermark foto milik pengguna yang login. Pemeriksaan standar dilakukan di SERVER berdasarkan
 * isi file (format, dimensi, transparansi, ukuran) -- gambar yang tidak sesuai ditolak (422) dengan daftar alasan.
 * Gambar lama pengguna di R2 dihapus setelah yang baru tersimpan. Foto listing yang SUDAH diunggah tidak diubah.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const kind = formData?.get("kind");
  const file = formData?.get("file");
  if ((kind !== "watermark" && kind !== "logo") || !(file instanceof File)) {
    return NextResponse.json({ error: "kind dan file wajib diisi" }, { status: 400 });
  }
  const k: BrandingKind = kind;
  const spec = BRANDING_SPECS[k];

  if (file.size > spec.maxBytes * 2) {
    return NextResponse.json({ error: "Ukuran file terlalu besar.", reasons: ["File terlalu besar. Kecilkan/kompres gambarnya."] }, { status: 422 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const info = readImageInfo(buffer);
  if (!info) {
    return NextResponse.json({ error: "Gambar tidak sesuai standar.", reasons: [`Format harus ${spec.formats.map((f) => (f === "png" ? "PNG" : "JPG")).join(" atau ")} yang valid.`] }, { status: 422 });
  }
  const reasons = validateBrandingImage(k, info);
  if (reasons.length > 0) {
    return NextResponse.json({ error: "Gambar tidak sesuai standar.", reasons }, { status: 422 });
  }

  const ext = info.format === "png" ? "png" : "jpg";
  const key = `branding/${user.id}/${k}-${crypto.randomUUID()}.${ext}`;
  let url: string;
  try {
    url = await uploadToR2(key, buffer, info.format === "png" ? "image/png" : "image/jpeg");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload gagal" }, { status: 500 });
  }

  const branding = await getUserBranding(supabase, user.id);
  const slot = k === "watermark" ? "watermark" : "docLogo";
  const previous = branding[slot];
  branding[slot] = { url, width: info.width, height: info.height, updatedAt: new Date().toISOString() };

  const { error } = await supabase
    .schema("property")
    .from("document_settings")
    .upsert({ user_id: user.id, branding: brandingToJson(branding), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) {
    await deleteFromR2(key).catch(() => undefined);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }

  // Bersihkan gambar lama milik pengguna ini saja (kunci R2 harus di bawah branding/<userId>/).
  const oldKey = previous ? r2KeyFromUrl(previous.url) : null;
  if (oldKey && oldKey.startsWith(`branding/${user.id}/`)) await deleteFromR2(oldKey).catch(() => undefined);

  return NextResponse.json({ ok: true, width: info.width, height: info.height });
}
