// src/components/settings/ConversationInsights.tsx

import { createClient } from "@/lib/supabase/server";
import { getConversationInsights, type InsightCount } from "@/lib/knowledge/getConversationInsights";

function CountList({ title, rows }: { title: string; rows: InsightCount[] }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">-</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map((row) => (
            <li key={row.label} className="flex items-start justify-between gap-3">
              <span>{row.label}</span>
              <span className="shrink-0 font-medium">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Insight pola lead 7 hari terakhir (Knowledge Loop langkah 5, v1) -- server component, mengikuti RLS sesi. */
export async function ConversationInsights() {
  const supabase = await createClient();
  const insights = await getConversationInsights(supabase);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {insights.totalLeads} lead baru dalam {insights.days} hari terakhir.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <CountList title="Tahap (Temperature)" rows={insights.temperature} />
        <CountList title="Paling dicari (Minat Lokasi)" rows={insights.minatLokasi} />
        <CountList title="Datang dari postingan/iklan" rows={insights.datangDari} />
        <CountList title="Sumber informasi" rows={insights.sumber} />
      </div>
    </div>
  );
}
