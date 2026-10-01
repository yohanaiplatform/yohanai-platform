// src/app/(dashboard)/panduan/page.tsx

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PANDUAN_SECTIONS } from "@/lib/panduan/sections";

/**
 * Index Panduan -- grid kartu per topik. Konten tiap topik didaftarkan di
 * src/lib/panduan/sections.tsx (satu tempat, gampang ditambah/diupdate kalau
 * ada fitur baru -- lihat komentar di file itu).
 */
export default function PanduanPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Panduan Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Cara pakai tiap fitur Yohan.AI Platform -- dokumen ini terus diperbarui tiap ada fitur baru.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PANDUAN_SECTIONS.map((section) => (
          <Link key={section.slug} href={`/panduan/${section.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{section.title}</CardTitle>
                  {section.status === "coming_soon" && (
                    <Badge variant="outline" className="shrink-0 border-amber-500/40 text-amber-700 dark:text-amber-400">
                      Segera Hadir
                    </Badge>
                  )}
                  {section.status === "partial" && (
                    <Badge variant="secondary" className="shrink-0">
                      Sebagian
                    </Badge>
                  )}
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
