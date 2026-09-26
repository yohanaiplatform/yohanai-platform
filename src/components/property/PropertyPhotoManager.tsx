"use client";

// src/components/property/PropertyPhotoManager.tsx

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadListingPhoto } from "@/lib/property/uploadListingPhoto";
import { Button } from "@/components/ui/button";
import type { Json } from "@/types/database";

interface PropertyPhotoManagerProps {
  listingId: string;
  metadata: Json;
  photoUrls: string[];
}

async function updatePhotoUrls(
  supabase: ReturnType<typeof createClient>,
  listingId: string,
  metadata: Json,
  photoUrls: string[]
) {
  const baseMetadata =
    typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) ? metadata : {};

  return supabase
    .schema("property")
    .from("listings")
    .update({ metadata: { ...baseMetadata, photo_urls: photoUrls } })
    .eq("id", listingId);
}

/** Foto pertama di array = foto sampul (dipakai di grid list & flyer promosi). */
export function PropertyPhotoManager({ listingId, metadata, photoUrls }: PropertyPhotoManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const { url, error: uploadError } = await uploadListingPhoto(supabase, listingId, file);
      if (uploadError || !url) {
        setError(`Gagal upload ${file.name}: ${uploadError}`);
        continue;
      }
      uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      await updatePhotoUrls(supabase, listingId, metadata, [...photoUrls, ...uploadedUrls]);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  async function handleRemove(url: string) {
    const supabase = createClient();
    await updatePhotoUrls(
      supabase,
      listingId,
      metadata,
      photoUrls.filter((u) => u !== url)
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {photoUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photoUrls.map((url, index) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  Sampul
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                aria-label="Hapus foto"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          disabled={uploading}
          className="hidden"
          id="photo-upload"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Mengunggah..." : "+ Upload Foto"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
