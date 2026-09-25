// src/app/(dashboard)/crm/new/page.tsx

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { AddLeadForm } from "@/components/crm/AddLeadForm";
import { getCrmDictionary } from "@/lib/i18n/getLocale";

export default async function NewLeadPage() {
  const t = await getCrmDictionary();

  return (
    <div className="space-y-6 p-6">
      <Link
        href="/crm"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.detail.back}
      </Link>

      <SectionCard title={t.addLead.title} description={t.addLead.description}>
        <AddLeadForm t={t} />
      </SectionCard>
    </div>
  );
}
