// src/components/settings/AiCreditCard.tsx

import { createClient } from "@/lib/supabase/server";
import { SectionCard } from "@/components/ui/section-card";
import { AiCreditForm } from "@/components/settings/AiCreditForm";

/** Kartu Settings "Saldo Kredit AI" -- hanya tampil untuk admin (server component). */
export async function AiCreditCard() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.schema("core").rpc("is_admin_or_above");
  if (!isAdmin) return null;

  return (
    <SectionCard
      title="Saldo Kredit AI"
      description="Khusus admin -- catat saldo kredit Claude Console supaya Platform Report memperingatkan sebelum saldo habis."
    >
      <AiCreditForm />
    </SectionCard>
  );
}
