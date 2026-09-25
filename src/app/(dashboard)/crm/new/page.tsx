// src/app/(dashboard)/crm/new/page.tsx

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { AddLeadForm } from "@/components/crm/AddLeadForm";

export default function NewLeadPage() {
  return (
    <div className="space-y-6 p-6">
      <Link
        href="/crm"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar lead
      </Link>

      <SectionCard
        title="Tambah Lead"
        description="Input manual untuk lead dari telepon, walk-in, atau sumber lain di luar Google Form."
      >
        <AddLeadForm />
      </SectionCard>
    </div>
  );
}
