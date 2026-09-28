// src/lib/property/uploadListingPhoto.ts

import imageCompression from "browser-image-compression";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { watermarkPhoto } from "@/lib/property/watermarkPhoto";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

/** Kompres file gambar di browser lalu upload ke bucket `properties`, return public URL. */
export async function uploadListingPhoto(
  supabase: SupabaseClient<Database>,
  listingId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  let compressed: File | Blob;
  try {
    compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  } catch {
    // Kalau kompresi gagal (mis. format tidak didukung), upload file asli saja daripada gagal total.
    compressed = file;
  }

  let watermarked: Blob;
  try {
    watermarked = await watermarkPhoto(compressed, file.type || "image/jpeg");
  } catch {
    // Watermark gagal (mis. logo gagal dimuat) -- upload versi tanpa watermark daripada gagal total.
    watermarked = compressed;
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `listings/${listingId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("properties")
    .upload(path, watermarked, { contentType: file.type || "image/jpeg" });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from("properties").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
