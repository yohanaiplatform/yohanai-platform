// src/app/api/properties/delete-photo/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2, r2KeyFromUrl } from "@/lib/storage/r2";

/**
 * Hapus permanen 1 foto listing dari Cloudflare R2. Dipanggil dari
 * PropertyPhotoManager.tsx SEBELUM metadata.photo_urls di-update (hapus
 * referensinya) -- kalau hapus dari R2 gagal, referensi foto TIDAK
 * dihapus dari listing, supaya tidak ada foto "hilang dari daftar tapi
 * masih makan storage tanpa ada yang tahu".
 *
 * Secret Access Key R2 tidak boleh sampai ke browser, sama seperti
 * upload-photo/route.ts -- makanya penghapusan juga wajib lewat route
 * handler, bukan dipanggil langsung dari Client Component.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url = body?.url;

  if (typeof url !== "string" || !url) {
    return NextResponse.json({ error: "url wajib diisi" }, { status: 400 });
  }

  const key = r2KeyFromUrl(url);
  if (!key) {
    // Bukan URL R2 (mis. sisa link lama) -- tidak ada yang perlu dihapus di R2,
    // aman lanjut hapus referensinya dari listing.
    return NextResponse.json({ success: true });
  }

  try {
    await deleteFromR2(key);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal hapus foto dari R2" },
      { status: 500 }
    );
  }
}
