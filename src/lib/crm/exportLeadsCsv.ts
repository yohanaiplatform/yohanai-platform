// src/lib/crm/exportLeadsCsv.ts

import type { LeadExportRow } from "@/lib/crm/getLeads";
import { getLeadMetadataString } from "@/lib/crm/getLeads";

const CSV_HEADERS = [
  "Nama",
  "Telepon",
  "Email",
  "Sumber",
  "Kategori",
  "Temperature",
  "Sudah Survey",
  "Status",
  "Ditugaskan ke",
  "Minat Unit / Lokasi",
  "Permintaan",
  "Komentar",
  "Tanggal Masuk",
] as const;

/** Escape sesuai RFC 4180 -- bungkus tanda kutip kalau isinya koma/kutip/baris baru. */
function csvCell(value: string | null | undefined): string {
  const text = value ?? "";
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildLeadsCsv(
  rows: LeadExportRow[],
  assignedToLabels: Map<string, string>
): string {
  const lines = [CSV_HEADERS.map(csvCell).join(",")];

  for (const row of rows) {
    const nama = `${row.first_name} ${row.last_name}`.trim() || "Tanpa Nama";
    const sumber =
      getLeadMetadataString(row.metadata, "sumber_informasi") ?? row.lead_source_name;
    const assignedLabel = row.assigned_to
      ? (assignedToLabels.get(row.assigned_to) ?? "-")
      : "-";

    lines.push(
      [
        nama,
        row.phone ?? "",
        row.email ?? "",
        sumber ?? "",
        getLeadMetadataString(row.metadata, "kategori") ?? "",
        getLeadMetadataString(row.metadata, "status_funnel_awal") ?? "",
        getLeadMetadataString(row.metadata, "sudah_survey") ?? "",
        row.status,
        assignedLabel,
        getLeadMetadataString(row.metadata, "minat_unit_lokasi") ?? "",
        getLeadMetadataString(row.metadata, "permintaan") ?? "",
        getLeadMetadataString(row.metadata, "komentar") ?? "",
        new Date(row.created_at).toLocaleDateString("id-ID"),
      ]
        .map(csvCell)
        .join(",")
    );
  }

  // BOM supaya Excel Windows kenali UTF-8 (kalau tidak, nama/karakter
  // non-ASCII bisa tampil rusak/mojibake saat dibuka langsung dari CSV).
  return "﻿" + lines.join("\r\n");
}
