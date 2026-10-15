// src/lib/crm/exportLeadsJson.ts

import type { LeadExportRow } from "@/lib/crm/getLeads";
import { getLeadMetadataString } from "@/lib/crm/getLeads";
import { LEAD_SUDAH_SURVEY_OPTIONS, LEAD_TEMPERATURE_OPTIONS } from "@/constants/crm";

/**
 * Daftar field CRM yang BOLEH keluar lewat ekspor JSON (allowlist). Sengaja hanya field inti lead untuk keperluan tim
 * pengembang front end: TIDAK menyertakan isi chat WhatsApp, catatan (notes), ringkasan/keputusan AI, alasan Batal/Closing,
 * data pemilik/komisi listing, UUID atau email akun agen, maupun isi `metadata` lain. Menambah field = tambah di sini DAN
 * di buildLeadsJson() -- jangan membuang seluruh `metadata` mentah ke luar.
 */
export const LEAD_JSON_FIELDS: { key: string; type: string; description: string }[] = [
  { key: "id", type: "string (uuid)", description: "ID lead" },
  { key: "first_name", type: "string", description: "Nama depan (atau nama profil WhatsApp)" },
  { key: "last_name", type: "string", description: "Nama belakang (sering kosong)" },
  { key: "phone", type: "string | null", description: "Nomor telepon/WhatsApp" },
  { key: "email", type: "string | null", description: "Email" },
  { key: "source", type: "string | null", description: "Sumber informasi lead (teks bebas, bergantung bisnis)" },
  { key: "category", type: "string | null", description: "Kategori lead (teks bebas, bergantung bisnis)" },
  { key: "temperature", type: "string | null", description: "Hot | Warm | Cold | Closing | Batal (lihat options.temperature)" },
  { key: "surveyed", type: "string | null", description: "Sudah | Belum" },
  { key: "status", type: "string", description: "Status pipeline lead" },
  { key: "assigned_to_name", type: "string | null", description: "Nama agen yang ditugaskan (tanpa email/ID)" },
  { key: "interest_unit_location", type: "string | null", description: "Minat unit/lokasi (teks bebas)" },
  { key: "request", type: "string | null", description: "Permintaan lead (teks bebas)" },
  { key: "comment", type: "string | null", description: "Komentar (teks bebas)" },
  { key: "created_at", type: "string (ISO 8601)", description: "Waktu lead masuk" },
];

export interface LeadsJsonExport {
  version: 1;
  exported_at: string;
  count: number;
  fields: typeof LEAD_JSON_FIELDS;
  options: { temperature: readonly string[]; surveyed: readonly string[] };
  leads: Record<string, string | null>[];
}

export function buildLeadsJson(
  rows: LeadExportRow[],
  assignedToNames: Map<string, string>
): LeadsJsonExport {
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    count: rows.length,
    fields: LEAD_JSON_FIELDS,
    // Opsi kategori/sumber SENGAJA tidak disertakan: nilainya khusus bisnis dan memuat nama proyek/orang.
    options: { temperature: LEAD_TEMPERATURE_OPTIONS, surveyed: LEAD_SUDAH_SURVEY_OPTIONS },
    leads: rows.map((row) => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      email: row.email,
      source: getLeadMetadataString(row.metadata, "sumber_informasi") ?? row.lead_source_name,
      category: getLeadMetadataString(row.metadata, "kategori"),
      temperature: getLeadMetadataString(row.metadata, "status_funnel_awal"),
      surveyed: getLeadMetadataString(row.metadata, "sudah_survey"),
      status: row.status,
      assigned_to_name: row.assigned_to ? (assignedToNames.get(row.assigned_to) ?? null) : null,
      interest_unit_location: getLeadMetadataString(row.metadata, "minat_unit_lokasi"),
      request: getLeadMetadataString(row.metadata, "permintaan"),
      comment: getLeadMetadataString(row.metadata, "komentar"),
      created_at: row.created_at,
    })),
  };
}
