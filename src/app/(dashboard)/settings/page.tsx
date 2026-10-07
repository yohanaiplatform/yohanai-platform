// src/app/(dashboard)/settings/page.tsx
import { Suspense } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { GoogleContactsConnection } from "@/components/settings/GoogleContactsConnection";
import { WhatsAppNumbersManager } from "@/components/settings/WhatsAppNumbersManager";
import { KnowledgeGapsManager } from "@/components/settings/KnowledgeGapsManager";
import { KnowledgePlacesManager } from "@/components/settings/KnowledgePlacesManager";
import { KnowledgeReviewQueue } from "@/components/settings/KnowledgeReviewQueue";
import { GeoRadiusSetting } from "@/components/settings/GeoRadiusSetting";
import { NurtureSettingsForm } from "@/components/settings/NurtureSettingsForm";
import { NurtureOverview } from "@/components/settings/NurtureOverview";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard title="Pengaturan Peta" description="Radius pencarian fasilitas umum di sekitar listing, khusus akun Anda.">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <GeoRadiusSetting />
        </Suspense>
      </SectionCard>

      <SectionCard
        title="Follow-up Otomatis (Nurturing)"
        description="Atur kapan lead yang diam di-follow-up otomatis lewat template WhatsApp -- khusus lead di akun Anda."
      >
        <NurtureSettingsForm />
      </SectionCard>

      <SectionCard title="Template &amp; Riwayat Follow-up" description="Template WhatsApp yang tersedia dan hasil follow-up otomatis 30 hari terakhir.">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <NurtureOverview />
        </Suspense>
      </SectionCard>

      <SectionCard title="Integrasi" description="Sambungkan akun pribadi Anda ke layanan luar.">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <GoogleContactsConnection />
        </Suspense>
      </SectionCard>

      <Suspense fallback={null}>
        <KnowledgeReviewQueue />
      </Suspense>

      <SectionCard
        title="Kamus Kawasan (Titik Peta)"
        description="Tempel link Google Maps jalan/kawasan/patokan yang sering ditanyakan konsumen. Asisten menghitung jaraknya ke listing."
      >
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <KnowledgePlacesManager />
        </Suspense>
      </SectionCard>

      <SectionCard
        title="Celah Pengetahuan Asisten"
        description="Hal-hal yang sering membuat asisten otomatis tidak bisa menjawab. Tulis jawabannya, dan asisten langsung memakainya."
      >
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <KnowledgeGapsManager />
        </Suspense>
      </SectionCard>

      <SectionCard
        title="Nomor WhatsApp & Pemilik"
        description="Khusus admin -- atur nomor WA mana jadi milik agent mana untuk lead baru otomatis."
      >
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <WhatsAppNumbersManager />
        </Suspense>
      </SectionCard>
    </div>
  );
}
