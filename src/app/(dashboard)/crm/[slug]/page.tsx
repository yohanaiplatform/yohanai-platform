// src/app/(dashboard)/crm/[slug]/page.tsx

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadStatusSelect } from "@/components/crm/LeadStatusSelect";
import { LeadAssignSelect } from "@/components/crm/LeadAssignSelect";
import { LeadDetailField } from "@/components/crm/LeadDetailField";
import { LeadIdentityEditable } from "@/components/crm/LeadIdentityEditable";
import { LeadEditableFields } from "@/components/crm/LeadEditableFields";
import { LeadNotes } from "@/components/crm/LeadNotes";
import { LeadWhatsApp } from "@/components/crm/LeadWhatsApp";
import { LeadListingLink } from "@/components/crm/LeadListingLink";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { SetBreadcrumbLabel } from "@/components/layout/BreadcrumbLabels";
import { getLeadBySlug } from "@/lib/crm/getLeadBySlug";
import { getLeadMetadataString } from "@/lib/crm/getLeads";
import { getLeadNotes } from "@/lib/crm/getLeadNotes";
import { getLeadConversation } from "@/lib/crm/getLeadConversation";
import { getListingsForSelect } from "@/lib/property/getListings";
import { createClient } from "@/lib/supabase/server";
import { getCrmDictionary } from "@/lib/i18n/getLocale";

interface LeadDetailPageProps {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;

  const supabase = await createClient();
  const t = await getCrmDictionary();
  const { data: lead, error } = await getLeadBySlug(supabase, slug);

  const backLink = (
    <Link
      href="/crm"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t.detail.back}
    </Link>
  );

  if (error) {
    return (
      <div className="space-y-6 p-6">
        {backLink}
        <EmptyState
          title={t.list.errorTitle}
          description={t.list.errorDescription}
        />
      </div>
    );
  }

  if (!lead) {
    notFound();
  }

  // Link lama (notifikasi, dsb) yang masih menunjuk /crm/<uuid> dari sebelum
  // slug ada tetap jalan lewat fallback id di getLeadBySlug() -- begitu
  // ketemu, kanonikalkan URL-nya ke slug supaya address bar selalu rapi.
  if (slug !== lead.slug) {
    redirect(`/crm/${lead.slug}`);
  }

  const { data: notes } = await getLeadNotes(supabase, lead.id);
  const { conversationId, data: chatMessages } = await getLeadConversation(supabase, lead.id);
  const listingsForSelect = await getListingsForSelect(supabase);

  const nama = `${lead.first_name} ${lead.last_name}`.trim() || t.list.table.noName;
  const manualListingId = getLeadMetadataString(lead.metadata, "manual_listing_id");
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
      <SetBreadcrumbLabel segment={lead.slug} label={nama} />
      {backLink}

      <SectionCard
        title={nama}
        description={`${t.detail.leadInPrefix} ${formatDateTime(lead.created_at)}`}
        action={<WhatsAppButton phone={lead.phone} nama={nama} />}
      >
        <div className="space-y-5">
          <LeadIdentityEditable
            leadId={lead.id}
            firstName={lead.first_name}
            lastName={lead.last_name}
            email={lead.email}
            phone={lead.phone}
          />
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <LeadDetailField label={t.detail.status} value={<LeadStatusSelect leadId={lead.id} status={lead.status} t={t} />} />
            <LeadDetailField
              label={t.detail.assignedTo}
              value={<LeadAssignSelect leadId={lead.id} assignedTo={lead.assigned_to} t={t} />}
            />
            <LeadDetailField label={t.detail.phone} value={lead.phone} />
            <LeadDetailField label={t.detail.email} value={lead.email} />
            <LeadDetailField label={t.detail.lastFollowUp} value={followUpTerakhir} />
            <LeadDetailField label={t.detail.submittedDate} value={submittedAt} />
            <LeadDetailField
              label={t.detail.lastUpdated}
              value={formatDateTime(lead.updated_at)}
            />
            <LeadDetailField
              label="Kaitkan ke Listing"
              value={
                <LeadListingLink
                  leadId={lead.id}
                  metadata={lead.metadata}
                  manualListingId={manualListingId}
                  listings={listingsForSelect}
                />
              }
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t.detail.detailTitle} description={t.detail.detailDescription}>
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
          t={t}
        />
      </SectionCard>

      <SectionCard title={t.detail.whatsappTitle} description={t.detail.whatsappDescription}>
        <LeadWhatsApp
          leadId={lead.id}
          conversationId={conversationId}
          messages={chatMessages}
          t={t}
        />
      </SectionCard>

      <SectionCard title={t.detail.notesTitle} description={t.detail.notesDescription}>
        <LeadNotes leadId={lead.id} notes={notes} t={t} />
      </SectionCard>
    </div>
  );
}
