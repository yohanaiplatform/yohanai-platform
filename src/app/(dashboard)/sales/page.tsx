// src/app/(dashboard)/sales/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getHotFollowUpLeads, getClosingLeads } from "@/lib/sales/getSalesData";
import { SalesSectionPicker } from "@/components/sales/SalesSectionPicker";
import { SectionCard } from "@/components/ui/section-card";
import { FollowUpLists } from "@/components/analysis/FollowUpLists";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFollowUps } from "@/lib/analysis/followUps";
import { resolveFollowUpScope } from "@/lib/analysis/followUpScope";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const supabase = await createClient();

  const scope = await resolveFollowUpScope(supabase);
  const [followUps, closingLeads, conversationFollowUps] = await Promise.all([
    getHotFollowUpLeads(supabase),
    getClosingLeads(supabase),
    // Scope dari sesi login (admin: semua lead; lainnya: hanya lead miliknya); gagal = bagian ini disembunyikan.
    scope ? getFollowUps(createAdminClient(), { assignedTo: scope.assignedTo }).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
        <p className="text-muted-foreground">
          Follow-up lead prioritas dan proses closing sampai serah terima kunci.
        </p>
      </header>

      {conversationFollowUps && (
        <div id="tindak-lanjut" className="scroll-mt-20">
          <SectionCard
            title="Lead perlu tindak lanjut"
            description="Dari percakapan WhatsApp 30 hari terakhir: yang menunggu balasan, yang sepi, dan yang berhenti setelah menyatakan keberatan."
          >
            <FollowUpLists followUps={conversationFollowUps} />
          </SectionCard>
        </div>
      )}

      <SalesSectionPicker
        hot={followUps.hot}
        warm={followUps.warm}
        followUpError={followUps.error}
        closingLeads={closingLeads.data}
        closingError={closingLeads.error}
      />
    </div>
  );
}
