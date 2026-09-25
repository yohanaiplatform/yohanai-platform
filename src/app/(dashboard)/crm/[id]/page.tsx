// src/app/(dashboard)/crm/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadStatusSelect } from "@/components/crm/LeadStatusSelect";
import { LeadAssignSelect } from "@/components/crm/LeadAssignSelect";
import { LeadDetailField } from "@/components/crm/LeadDetailField";
import { LeadEditableFields } from "@/components/crm/LeadEditableFields";
import { LeadNotes } from "@/components/crm/LeadNotes";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { SetBreadcrumbLabel } from "@/components/layout/BreadcrumbLabels";
import { getLeadById } from "@/lib/crm/getLeadById";
import { getLeadMetadataString } from "@/lib/crm/getLeads";
import { getLeadNotes } from "@/lib/crm/getLeadNotes";
import { createClient } from "@/lib/supabase/server";

// Cek bentuk UUID dulu sebelum query -- id acak/rusak di URL akan bikin
// Postgres balas error "invalid input syntax for type uuid", yang tanpa
// pengecekan ini akan salah ditampilkan sebagai error database, padahal
// seharusnya cukup 404.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * follow_up_terakhir dan submitted_at di metadata tersimpan mentah sebagai
 * String(dateObject) dari Apps Script (format Date.prototype.toString() V8,
 * mis. "Mon Sep 07 2026 19:58:44 GMT+0700 ..."), bukan ISO -- beda dari
 * created_at yang sudah diparse eksplisit di route.ts. new Date() bisa
 * parse ini langsung karena originnya sama-sama V8.
 */
function formatMetadataDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatDateTime(parsed.toISOString());
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: lead, error } = await getLeadById(supabase, id);

  const backLink = (
    <Link
      href="/crm"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Kembali ke daftar lead
    </Link>
  );

  if (error) {
    return (
      <div className="space-y-6 p-6">
        {backLink}
        <EmptyState
          title="Error"
          description="Gagal memuat data lead. Coba muat ulang halaman."
        />
      </div>
    );
  }

  if (!lead) {
    notFound();
  }

  const { data: notes } = await getLeadNotes(supabase, id);

  const nama = `${lead.first_name} ${lead.last_name}`.trim() || "Tanpa Nama";
  const kategori = getLeadMetadataString(lead.metadata, "kategori");
  const sumberInformasi = getLeadMetadataString(lead.metadata, "sumber_informasi");
  const permintaan = getLeadMetadataString(lead.metadata, "permintaan");
  const komentar = getLeadMetadataString(lead.metadata, "komentar");
  const minatUnitLokasi = getLeadMetadataString(lead.metadata, "minat_unit_lokasi");
  const sudahSurvey = getLeadMetadataString(lead.metadata, "sudah_survey");
  const statusFunnelAwal = getLeadMetadataString(lead.metadata, "status_funnel_awal");
  const followUpTerakhir = formatMetadataDate(
    getLeadMetadataString(lead.metadata, "follow_up_terakhir")
  );
  const submittedAt = formatMetadataDate(
    getLeadMetadataString(lead.metadata, "submitted_at")
  );

  return (
    <div className="space-y-6 p-6">
      <SetBreadcrumbLabel segment={lead.id} label={nama} />
      {backLink}

      <SectionCard
        title={nama}
        description={`Lead masuk ${formatDateTime(lead.created_at)}`}
        action={<WhatsAppButton phone={lead.phone} nama={nama} />}
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <LeadDetailField label="Status" value={<LeadStatusSelect leadId={lead.id} status={lead.status} />} />
          <LeadDetailField
            label="Ditugaskan ke"
            value={<LeadAssignSelect leadId={lead.id} assignedTo={lead.assigned_to} />}
          />
          <LeadDetailField label="Telepon" value={lead.phone} />
          <LeadDetailField label="Email" value={lead.email} />
          <LeadDetailField label="Follow-up Terakhir" value={followUpTerakhir} />
          <LeadDetailField label="Tanggal Submit Form" value={submittedAt} />
          <LeadDetailField
            label="Terakhir Diperbarui"
            value={formatDateTime(lead.updated_at)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Detail Lead" description="Bisa diubah kapan saja saat ada follow-up baru.">
        <LeadEditableFields
          leadId={lead.id}
          metadata={lead.metadata}
          sumberInformasi={sumberInformasi}
          leadSourceName={lead.lead_source_name}
          kategori={kategori}
          statusFunnelAwal={statusFunnelAwal}
          sudahSurvey={sudahSurvey}
          minatUnitLokasi={minatUnitLokasi}
          permintaan={permintaan}
          komentar={komentar}
        />
      </SectionCard>

      <SectionCard title="Catatan" description="Riwayat update, dengan waktu -- tidak menimpa catatan sebelumnya.">
        <LeadNotes leadId={lead.id} notes={notes} />
      </SectionCard>
    </div>
  );
}
