"use client";

// src/components/crm/LeadEditableFields.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import {
  LEAD_KATEGORI_OPTIONS,
  LEAD_SUMBER_OPTIONS,
  LEAD_TEMPERATURE_OPTIONS,
  LEAD_SUDAH_SURVEY_OPTIONS,
} from "@/constants/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LeadDetailField } from "@/components/crm/LeadDetailField";
import { LeadCategoryBadge } from "@/components/crm/lead-category-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadEditableFieldsProps {
  leadId: string;
  metadata: Json;
  sumberInformasi: string | null;
  /** Fallback tampilan kalau sumberInformasi kosong (mis. lead lama tanpa metadata itu). */
  leadSourceName: string | null;
  kategori: string | null;
  statusFunnelAwal: string | null;
  sudahSurvey: string | null;
  minatUnitLokasi: string | null;
  permintaan: string | null;
  komentar: string | null;
}

export function LeadEditableFields({
  leadId,
  metadata,
  sumberInformasi,
  leadSourceName,
  kategori,
  statusFunnelAwal,
  sudahSurvey,
  minatUnitLokasi,
  permintaan,
  komentar,
}: LeadEditableFieldsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formSumber, setFormSumber] = useState(sumberInformasi ?? "");
  const [formKategori, setFormKategori] = useState(kategori ?? "");
  const [formTemperature, setFormTemperature] = useState(statusFunnelAwal ?? "");
  const [formSudahSurvey, setFormSudahSurvey] = useState(sudahSurvey ?? "");
  const [formMinatUnitLokasi, setFormMinatUnitLokasi] = useState(minatUnitLokasi ?? "");
  const [formPermintaan, setFormPermintaan] = useState(permintaan ?? "");
  const [formKomentar, setFormKomentar] = useState(komentar ?? "");

  function handleCancel() {
    setFormSumber(sumberInformasi ?? "");
    setFormKategori(kategori ?? "");
    setFormTemperature(statusFunnelAwal ?? "");
    setFormSudahSurvey(sudahSurvey ?? "");
    setFormMinatUnitLokasi(minatUnitLokasi ?? "");
    setFormPermintaan(permintaan ?? "");
    setFormKomentar(komentar ?? "");
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const baseMetadata =
      typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
        ? metadata
        : {};

    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema("customer")
      .from("leads")
      .update({
        metadata: {
          ...baseMetadata,
          sumber_informasi: formSumber || null,
          kategori: formKategori || null,
          status_funnel_awal: formTemperature || null,
          sudah_survey: formSudahSurvey || null,
          minat_unit_lokasi: formMinatUnitLokasi || null,
          permintaan: formPermintaan || null,
          komentar: formKomentar || null,
        },
      })
      .eq("id", leadId);

    setSaving(false);

    if (updateError) {
      setError("Gagal menyimpan perubahan. Coba lagi.");
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
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <LeadDetailField label="Sumber" value={sumberInformasi ?? leadSourceName} />
          <LeadDetailField label="Kategori" value={<LeadCategoryBadge kategori={kategori} />} />
          <LeadDetailField label="Temperature Awal" value={statusFunnelAwal} />
          <LeadDetailField label="Sudah Survey" value={sudahSurvey} />
          <LeadDetailField label="Minat Unit / Lokasi" value={minatUnitLokasi} />
          <div />
          <LeadDetailField label="Permintaan" value={permintaan} />
          <LeadDetailField label="Komentar" value={komentar} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-sumber">Sumber Informasi</Label>
          <Select value={formSumber} onValueChange={(v) => setFormSumber(v ?? "")}>
            <SelectTrigger id="edit-sumber">
              <SelectValue placeholder="Pilih sumber" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SUMBER_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-kategori">Kategori / Property</Label>
          <Select value={formKategori} onValueChange={(v) => setFormKategori(v ?? "")}>
            <SelectTrigger id="edit-kategori">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_KATEGORI_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-temperature">Temperature Awal</Label>
          <Select value={formTemperature} onValueChange={(v) => setFormTemperature(v ?? "")}>
            <SelectTrigger id="edit-temperature">
              <SelectValue placeholder="Pilih temperature" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_TEMPERATURE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-sudah-survey">Sudah Survey</Label>
          <Select value={formSudahSurvey} onValueChange={(v) => setFormSudahSurvey(v ?? "")}>
            <SelectTrigger id="edit-sudah-survey">
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SUDAH_SURVEY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="edit-minat">Minat Unit / Lokasi</Label>
          <Input
            id="edit-minat"
            value={formMinatUnitLokasi}
            onChange={(e) => setFormMinatUnitLokasi(e.target.value)}
            placeholder="mis. Ampera Raya"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-permintaan">Permintaan</Label>
        <Textarea
          id="edit-permintaan"
          value={formPermintaan}
          onChange={(e) => setFormPermintaan(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-komentar">Komentar</Label>
        <Textarea
          id="edit-komentar"
          value={formKomentar}
          onChange={(e) => setFormKomentar(e.target.value)}
          rows={3}
        />
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
