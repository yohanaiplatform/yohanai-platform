// src/lib/property/uploadListingPhoto.ts

import imageCompression from "browser-image-compression";
import { watermarkPhoto } from "@/lib/property/watermarkPhoto";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

/**
 * Kompres + watermark file gambar di browser, lalu upload ke Cloudflare R2
 * lewat POST /api/properties/upload-photo (Secret Access Key R2 cuma boleh
 * dipegang server, tidak boleh sampai ke browser -- beda dari versi lama
 * yang upload langsung dari browser ke Supabase Storage pakai anon key).
 * Return public URL R2.
 */
export async function uploadListingPhoto(
  listingId: string,
  file: File
): Promise<{ url: string | null; error: string | null; watermarkFailed?: boolean }> {
  let compressed: File | Blob;
  try {
    compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  } catch {
    // Kalau kompresi gagal (mis. format tidak didukung), upload file asli saja daripada gagal total.
    compressed = file;
  }

  let watermarked: Blob;
  let watermarkFailed = false;
  try {
    watermarked = await watermarkPhoto(compressed, file.type || "image/jpeg");
  } catch (watermarkError) {
    // Watermark gagal -- tetap upload versi tanpa watermark daripada gagal total, TAPI beri tahu
    // pemanggil supaya pengguna tahu (dulu gagal diam-diam, ketemu 4 Okt 2026 pada foto dari HP).
    console.warn("Watermark gagal:", watermarkError);
    watermarked = compressed;
    watermarkFailed = true;
  }

  const formData = new FormData();
  formData.append("listingId", listingId);
  formData.append("file", watermarked, file.name);

  const res = await fetch("/api/properties/upload-photo", { method: "POST", body: formData });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { url: null, error: body?.error ?? "Upload gagal" };
  }

  const { url } = await res.json();
  return { url: url ?? null, error: url ? null : "Upload gagal", watermarkFailed };
}
