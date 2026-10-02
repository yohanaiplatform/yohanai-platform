"use client";

// src/components/property/PropertyVideoEditable.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyVideoEmbed } from "@/components/property/PropertyVideoEmbed";

interface PropertyVideoEditableProps {
  listingId: string;
  metadata: Json;
  videoUrl: string | null;
}

/** Lihat + edit link video listing (metadata.video_url). Akses ditentukan RLS listings_owner_or_admin. */
export function PropertyVideoEditable({ listingId, metadata, videoUrl }: PropertyVideoEditableProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(videoUrl ?? "");

  function handleCancel() {
    setValue(videoUrl ?? "");
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const baseMetadata =
      typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) ? metadata : {};

    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema("property")
      .from("listings")
      .update({ metadata: { ...baseMetadata, video_url: value.trim() || null } })
      .eq("id", listingId);

    setSaving(false);

    if (updateError) {
      setError("Gagal menyimpan video. Coba lagi.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            {videoUrl ? "Edit" : "Tambah Video"}
          </Button>
        </div>
        {videoUrl ? (
          <PropertyVideoEmbed url={videoUrl} />
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada video.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="edit-video-url" className="text-sm font-medium">
          Link Video (YouTube / Google Drive)
        </label>
        <Input
          id="edit-video-url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://youtu.be/..."
        />
        <p className="text-xs text-muted-foreground">Kosongkan untuk menghapus video.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Save"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
          Batal
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
