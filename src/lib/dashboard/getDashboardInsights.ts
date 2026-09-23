// src/lib/dashboard/getDashboardInsights.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Insight } from "@/types/dashboard";
import { PRIORITY } from "@/constants/dashboard";
import { getLeadMetadataString } from "@/lib/crm/getLeads";

const FOLLOW_UP_OVERDUE_HOURS = 48;

/**
 * Satu-satunya insight di panel ini yang dihitung dari data ASLI.
 * "Belum di-follow-up" = metadata->>follow_up_terakhir kosong atau lebih
 * lama dari FOLLOW_UP_OVERDUE_HOURS, untuk lead Hot/Warm (Cold/Closing/
 * Batal tidak mendesak). follow_up_terakhir disimpan sebagai
 * Date.toString() V8 dari Apps Script, di-parse lewat new Date() (bukan
 * dari Postgres, karena PostgREST tidak bisa filter hasil regexp+cast).
 */
async function getFollowUpBacklogInsight(
  supabase: SupabaseClient<Database>
): Promise<Insight> {
  const cutoff = Date.now() - FOLLOW_UP_OVERDUE_HOURS * 60 * 60 * 1000;

  const { data, error } = await supabase
    .schema("customer")
    .from("leads")
    .select("metadata")
    .or(
      "metadata->>status_funnel_awal.ilike.hot,metadata->>status_funnel_awal.ilike.warm"
    )
    .is("deleted_at", null);

  const overdueCount =
    !error && data
      ? data.filter((lead) => {
          const followUpTerakhir = getLeadMetadataString(
            lead.metadata,
            "follow_up_terakhir"
          );
          if (!followUpTerakhir) return true;
          const parsed = new Date(followUpTerakhir).getTime();
          return Number.isNaN(parsed) || parsed < cutoff;
        }).length
      : 0;

  return {
    id: "insight-followup-backlog",
    title: "Follow-up Backlog",
    description:
      overdueCount > 0
        ? `${overdueCount} lead Hot/Warm belum di-follow-up dalam ${FOLLOW_UP_OVERDUE_HOURS} jam terakhir. Klik untuk lihat daftarnya.`
        : "Semua lead Hot/Warm sudah di-follow-up dalam 48 jam terakhir.",
    category: "action",
    priority: overdueCount > 20 ? PRIORITY.HIGH.toLowerCase() as "high" : overdueCount > 0 ? PRIORITY.MEDIUM.toLowerCase() as "medium" : PRIORITY.LOW.toLowerCase() as "low",
    created_at: new Date().toISOString(),
    href: "/crm?temperature=hot,warm",
  };
}

export async function getDashboardInsights(
  supabase: SupabaseClient<Database>
): Promise<Insight[]> {
  const now = new Date().toISOString();
  const followUpBacklog = await getFollowUpBacklogInsight(supabase);

  return [
    followUpBacklog,
    {
      id: "insight-1",
      title: "Buyer Behavior Insight",
      description:
        "(Contoh) Lead #8821 viewed pricing page 3 times in the last hour, indicating high purchase intent.",
      category: "behavior",
      priority: PRIORITY.HIGH.toLowerCase() as "high",
      created_at: now,
      isPlaceholder: true,
    },
    {
      id: "insight-3",
      title: "Priority Alert",
      description:
        "(Contoh) Competitor price drop detected in South Jakarta area for 3-bedroom properties.",
      category: "alert",
      priority: PRIORITY.HIGH.toLowerCase() as "high",
      created_at: now,
      isPlaceholder: true,
    },
  ];
}
