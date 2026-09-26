// src/lib/property/uploadListingPhoto.ts

import imageCompression from "browser-image-compression";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

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

  const ext = file.name.split(".").pop() || "jpg";
  const path = `listings/${listingId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("properties")
    .upload(path, compressed, { contentType: file.type || "image/jpeg" });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from("properties").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
