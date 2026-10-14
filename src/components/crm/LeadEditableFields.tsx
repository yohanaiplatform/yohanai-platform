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
  reasonOptionsFor,
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
import type { CrmDictionary } from "@/lib/i18n/dictionaries";

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
  /** Alasan di balik status Batal/Closing (metadata.alasan_status), bila sudah dicatat. */
  alasanStatus: { status: string; alasan: string; catatan: string | null; at: string | null } | null;
  t: CrmDictionary;
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
  alasanStatus,
  t,
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
  const [formAlasan, setFormAlasan] = useState(alasanStatus?.alasan ?? "");
  const [formAlasanCatatan, setFormAlasanCatatan] = useState(alasanStatus?.catatan ?? "");

  function handleCancel() {
    setFormSumber(sumberInformasi ?? "");
    setFormKategori(kategori ?? "");
    setFormTemperature(statusFunnelAwal ?? "");
    setFormSudahSurvey(sudahSurvey ?? "");
    setFormMinatUnitLokasi(minatUnitLokasi ?? "");
    setFormPermintaan(permintaan ?? "");
    setFormKomentar(komentar ?? "");
    setFormAlasan(alasanStatus?.alasan ?? "");
    setFormAlasanCatatan(alasanStatus?.catatan ?? "");
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    setError(null);

    // Alasan wajib hanya saat Temperature BARU diubah menjadi Batal/Closing (mengedit field lain pada lead yang sudah
    // Batal/Closing tidak dipaksa mengisi). Alasan lama dipakai ulang bila Temperature tidak berubah.
    const reasonOptions = reasonOptionsFor(formTemperature);
    const temperatureChanged = formTemperature !== (statusFunnelAwal ?? "");
    const alasanForStatus = alasanStatus?.status === formTemperature ? alasanStatus.alasan : "";
    const finalAlasan = formAlasan || alasanForStatus;
    if (reasonOptions && temperatureChanged && !finalAlasan) {
      setError(t.detail.reasonRequired);
      return;
    }
    setSaving(true);

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
          // Alasan status akhir (Batal/Closing); dihapus bila Temperature bukan lagi salah satunya.
          alasan_status:
            reasonOptions && finalAlasan
              ? {
                  status: formTemperature,
                  alasan: finalAlasan,
                  catatan: formAlasanCatatan.trim() || null,
                  at: alasanStatus?.status === formTemperature && alasanStatus.alasan === finalAlasan ? (alasanStatus.at ?? new Date().toISOString()) : new Date().toISOString(),
                }
              : null,
        },
      })
      .eq("id", leadId);

    setSaving(false);

    if (updateError) {
      setError(t.detail.saveError);
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
            {t.detail.edit}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <LeadDetailField label={t.detail.source} value={sumberInformasi ?? leadSourceName} />
          <LeadDetailField label={t.detail.category} value={<LeadCategoryBadge kategori={kategori} />} />
          <LeadDetailField label={t.detail.temperature} value={statusFunnelAwal} />
          {alasanStatus && (
            <LeadDetailField
              label={alasanStatus.status === "Batal" ? t.detail.reasonBatal : t.detail.reasonClosing}
              value={alasanStatus.catatan ? `${alasanStatus.alasan} (${alasanStatus.catatan})` : alasanStatus.alasan}
            />
          )}
          <LeadDetailField label={t.detail.surveyed} value={sudahSurvey} />
          <LeadDetailField label={t.detail.unitLocation} value={minatUnitLokasi} />
          <div />
          <LeadDetailField label={t.detail.request} value={permintaan} />
          <LeadDetailField label={t.detail.comment} value={komentar} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-sumber">{t.addLead.source}</Label>
          <Select value={formSumber} onValueChange={(v) => setFormSumber(v ?? "")}>
            <SelectTrigger id="edit-sumber">
              <SelectValue placeholder={t.addLead.sourcePlaceholder} />
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
          <Label htmlFor="edit-kategori">{t.addLead.category}</Label>
          <Select value={formKategori} onValueChange={(v) => setFormKategori(v ?? "")}>
            <SelectTrigger id="edit-kategori">
              <SelectValue placeholder={t.addLead.categoryPlaceholder} />
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
          <Label htmlFor="edit-temperature">{t.addLead.temperature}</Label>
          <Select value={formTemperature} onValueChange={(v) => setFormTemperature(v ?? "")}>
            <SelectTrigger id="edit-temperature">
              <SelectValue placeholder={t.addLead.temperaturePlaceholder} />
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

        {reasonOptionsFor(formTemperature) && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-alasan">{formTemperature === "Batal" ? t.detail.reasonBatal : t.detail.reasonClosing}</Label>
            <Select value={formAlasan} onValueChange={(v) => setFormAlasan(v ?? "")}>
              <SelectTrigger id="edit-alasan">
                <SelectValue placeholder={t.detail.reasonPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {(reasonOptionsFor(formTemperature) ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={formAlasanCatatan} onChange={(e) => setFormAlasanCatatan(e.target.value)} placeholder={t.detail.reasonNote} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="edit-sudah-survey">{t.addLead.surveyed}</Label>
          <Select value={formSudahSurvey} onValueChange={(v) => setFormSudahSurvey(v ?? "")}>
            <SelectTrigger id="edit-sudah-survey">
              <SelectValue placeholder={t.addLead.surveyedPlaceholder} />
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
          <Label htmlFor="edit-minat">{t.addLead.unitLocation}</Label>
          <Input
            id="edit-minat"
            value={formMinatUnitLokasi}
            onChange={(e) => setFormMinatUnitLokasi(e.target.value)}
            placeholder={t.addLead.unitLocationPlaceholder}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-permintaan">{t.addLead.request}</Label>
        <Textarea
          id="edit-permintaan"
          value={formPermintaan}
          onChange={(e) => setFormPermintaan(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-komentar">{t.addLead.comment}</Label>
        <Textarea
          id="edit-komentar"
          value={formKomentar}
          onChange={(e) => setFormKomentar(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? t.detail.saving : t.detail.save}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
          {t.detail.cancel}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
