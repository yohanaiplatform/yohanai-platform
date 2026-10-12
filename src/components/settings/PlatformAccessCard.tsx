// src/components/settings/PlatformAccessCard.tsx

import { createClient } from "@/lib/supabase/server";
import { SectionCard } from "@/components/ui/section-card";
import { PlatformAccessManager } from "@/components/settings/PlatformAccessManager";

/** Kartu Settings "Penerima Laporan Platform" -- hanya tampil untuk admin (server component). */
export async function PlatformAccessCard() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.schema("core").rpc("is_admin_or_above");
  if (!isAdmin) return null;

  return (
    <SectionCard
      title="Penerima Laporan Platform"
      description="Khusus admin -- beri akun non-admin akses ke Platform Report dan halaman Master Admin tanpa menjadikannya admin penuh."
    >
      <PlatformAccessManager />
    </SectionCard>
  );
}
