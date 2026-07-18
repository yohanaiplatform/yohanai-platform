// src/lib/dashboard/getRecentLeads.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { RecentLead } from "@/types/dashboard";
import { LIMITS } from "@/constants/dashboard";

export async function getRecentLeads(supabase: SupabaseClient): Promise<{ data: RecentLead[] | null; error: boolean }> {
  const res = await supabase
    .schema("customer")
    .from("leads")
    .select("id, name, status, agent, source, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(LIMITS.RECENT_LEADS);

  return {
    data: res.error ? null : (res.data as RecentLead[]),
    error: !!res.error,
  };
}