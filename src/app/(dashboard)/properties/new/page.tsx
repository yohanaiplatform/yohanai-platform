// src/app/(dashboard)/properties/new/page.tsx

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { AddListingForm } from "@/components/property/AddListingForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .schema("property")
    .from("categories")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="space-y-6 p-6">
      <Link
        href="/properties"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar listing
      </Link>

      <SectionCard
        title="Tambah Listing"
        description="Input manual untuk properti baru."
      >
        <AddListingForm categories={categories ?? []} />
      </SectionCard>
    </div>
  );
}
