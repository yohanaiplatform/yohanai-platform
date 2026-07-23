// src/lib/dashboard/getRecentLeads.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { RecentLead } from "@/types/dashboard";
import { LIMITS } from "@/constants/dashboard";

export async function getRecentLeads(
  supabase: SupabaseClient<Database>
): Promise<{ data: RecentLead[] | null; error: boolean }> {
  const res = await supabase
    .schema("customer")
    .from("leads")
    .select("id, first_name, last_name, status, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(LIMITS.RECENT_LEADS);

  return {
    data: res.error
      ? null
      : (res.data ?? []).map((lead) => ({
          id: lead.id,
          name: `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim(),
          status: lead.status,
          agent: null,
          source: null,
          created_at: lead.created_at,
        })),
    error: !!res.error,
  };
}