"use client";

// src/components/property/PropertyAiInfoEditable.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AI_INFO_FIELDS, countFilledAiInfo, type AiInfo } from "@/lib/property/aiInfo";

interface PropertyAiInfoEditableProps {
  listingId: string;
  metadata: Json;
  aiInfo: AiInfo;
}

/** Info resmi per listing yang dibaca asisten AI (metadata.ai_info). Akses mengikuti RLS listing. */
export function PropertyAiInfoEditable({ listingId, metadata, aiInfo }: PropertyAiInfoEditableProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AiInfo>(aiInfo);

  const filled = countFilledAiInfo(aiInfo);

  function handleCancel() {
    setForm(aiInfo);
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const cleaned: AiInfo = {};
    for (const field of AI_INFO_FIELDS) {
      const value = form[field.key]?.trim();
      if (value) cleaned[field.key] = value;
    }

    const baseMetadata =
      typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) ? metadata : {};

    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema("property")
      .from("listings")
      .update({ metadata: { ...baseMetadata, ai_info: cleaned } })
      .eq("id", listingId);

    setSaving(false);
    if (updateError) {
      setError("Gagal menyimpan. Coba lagi.");
      return;
    }
    setIsEditing(false);
    router.refresh();
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {filled} dari {AI_INFO_FIELDS.length} kategori terisi
            {filled < 6 && " -- semakin lengkap, semakin akurat jawaban asisten."}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {AI_INFO_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <div className="text-xs text-muted-foreground">{field.label}</div>
              <div className="whitespace-pre-wrap text-sm">
                {aiInfo[field.key] || <span className="text-muted-foreground">-</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Tulis fakta yang sudah pasti. Kosongkan kalau belum tahu -- asisten akan meneruskan ke agen, bukan menebak.
      </p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {AI_INFO_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={`ai-info-${field.key}`}>{field.label}</Label>
            <Textarea
              id={`ai-info-${field.key}`}
              rows={field.rows}
              maxLength={800}
              value={form[field.key] ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground">{field.hint}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
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
