// src/app/api/properties/upload-photo/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2 } from "@/lib/storage/r2";

/**
 * Upload foto listing ke Cloudflare R2. Kompresi + watermark tetap terjadi
 * di browser (uploadListingPhoto.ts) -- route ini cuma menerima hasil akhir
 * dan menaruhnya ke R2, karena Secret Access Key R2 tidak boleh sampai ke
 * browser (beda dari Supabase Storage lama yang boleh diupload langsung
 * dari client pakai anon/session key).
 *
 * Diamankan lewat sesi login (siapa saja yang login boleh upload -- RLS
 * `listings_owner_or_admin` tetap membatasi siapa yang bisa menyimpan
 * photo_urls-nya ke listing lewat update metadata setelahnya).
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const listingId = formData.get("listingId");

  if (!(file instanceof File) || typeof listingId !== "string" || !listingId) {
    return NextResponse.json({ error: "file dan listingId wajib diisi" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `listings/${listingId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadToR2(key, buffer, file.type || "image/jpeg");
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload gagal" },
      { status: 500 }
    );
  }
}
