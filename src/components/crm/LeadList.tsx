// src/components/crm/LeadList.tsx

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadStatusBadge } from "@/components/crm/lead-status-badge";
import { LeadCategoryBadge } from "@/components/crm/lead-category-badge";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { getLeadMetadataString, type LeadListItem } from "@/lib/crm/getLeads";
import type { CrmDictionary } from "@/lib/i18n/dictionaries";

interface LeadListProps {
  data: LeadListItem[] | null;
  error: boolean;
  t: CrmDictionary;
}

export function LeadList({ data, error, t }: LeadListProps) {
  if (error) {
    return (
      <EmptyState
        title={t.list.errorTitle}
        description={t.list.errorDescription}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={t.list.emptyTitle}
        description={t.list.emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">{t.list.table.name}</th>
            <th className="px-3 py-2 font-medium">{t.list.table.contact}</th>
            <th className="px-3 py-2 font-medium">{t.list.table.source}</th>
            <th className="px-3 py-2 font-medium">{t.list.table.category}</th>
            <th className="px-3 py-2 font-medium">{t.list.table.status}</th>
            <th className="px-3 py-2 font-medium">{t.list.table.dateIn}</th>
            <th className="px-3 py-2 font-medium">{t.list.table.action}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((lead) => {
            const kategori = getLeadMetadataString(lead.metadata, "kategori");
            const sumberInformasi = getLeadMetadataString(
              lead.metadata,
              "sumber_informasi"
            );
            const nama = `${lead.first_name} ${lead.last_name}`.trim() || t.list.table.noName;

            return (
              <tr
                key={lead.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-3 py-3 font-medium">
                  <Link
                    href={`/crm/${lead.id}`}
                    className="hover:underline underline-offset-2"
                  >
                    {nama}
                  </Link>
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {lead.phone ?? lead.email ?? "-"}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {sumberInformasi ?? lead.lead_source_name ?? "-"}
                </td>
                <td className="px-3 py-3">
                  <LeadCategoryBadge kategori={kategori} />
                </td>
                <td className="px-3 py-3">
                  <LeadStatusBadge status={lead.status} t={t} />
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {new Date(lead.created_at).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-3">
                  <WhatsAppButton phone={lead.phone} nama={nama} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
