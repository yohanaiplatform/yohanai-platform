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
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      lead_source_id,
      status,
      created_at
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(LIMITS.RECENT_LEADS);

  return {
    data: res.error
      ? null
      : (res.data ?? []).map((lead): RecentLead => ({
          id: lead.id,
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          lead_source_id: lead.lead_source_id,
          status: lead.status,
          created_at: lead.created_at,
        })),
    error: !!res.error,
  };
}