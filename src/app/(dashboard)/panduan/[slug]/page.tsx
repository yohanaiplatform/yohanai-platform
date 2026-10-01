// src/app/(dashboard)/panduan/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";
import { PropertyVideoEmbed } from "@/components/property/PropertyVideoEmbed";
import { PANDUAN_SECTIONS, getPanduanSection } from "@/lib/panduan/sections";

interface PanduanDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PANDUAN_SECTIONS.map((section) => ({ slug: section.slug }));
}

export default async function PanduanDetailPage({ params }: PanduanDetailPageProps) {
  const { slug } = await params;
  const section = getPanduanSection(slug);

  if (!section) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <Link
        href="/panduan"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Panduan
      </Link>

      <SectionCard
        title={section.title}
        description={section.description}
        action={
          section.status === "coming_soon" ? (
            <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
              Segera Hadir
            </Badge>
          ) : section.status === "partial" ? (
            <Badge variant="secondary">Sebagian</Badge>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {section.videoUrl && <PropertyVideoEmbed url={section.videoUrl} />}
          <section.Content />
        </div>
      </SectionCard>
    </div>
  );
}
