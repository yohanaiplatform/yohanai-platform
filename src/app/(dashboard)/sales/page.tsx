// src/app/(dashboard)/sales/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getHotFollowUpLeads, getClosingLeads } from "@/lib/sales/getSalesData";
import { SalesSectionPicker } from "@/components/sales/SalesSectionPicker";

export default async function SalesPage() {
  const supabase = await createClient();

  const [followUps, closingLeads] = await Promise.all([
    getHotFollowUpLeads(supabase),
    getClosingLeads(supabase),
  ]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
        <p className="text-muted-foreground">
          Follow-up lead prioritas dan proses closing sampai serah terima kunci.
        </p>
      </header>

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
