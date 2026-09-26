// src/app/(dashboard)/properties/categories/page.tsx

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { CategoryManager } from "@/components/property/CategoryManager";
import { getCategories } from "@/lib/property/categories";
import { createClient } from "@/lib/supabase/server";

export default async function PropertyCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await getCategories(supabase, { includeDeleted: true });

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
        title="Kelola Kategori"
        description="Tambah, ubah, atau hapus kategori properti. Kategori yang dihapus tidak muncul lagi di dropdown, tapi listing lama yang sudah memakainya tetap aman."
      >
        <CategoryManager categories={categories} />
      </SectionCard>
    </div>
  );
}
