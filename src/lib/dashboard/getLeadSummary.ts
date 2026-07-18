// src/lib/dashboard/getLeadSummary.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { LeadSummary } from "@/types/dashboard";
import { LEAD_STATUS } from "@/constants/dashboard";

export async function getLeadSummary(supabase: SupabaseClient): Promise<LeadSummary> {
  const [hotRes, warmRes, coldRes] = await Promise.all([
    supabase.schema("customer").from("leads").select("id", { count: "exact", head: true }).eq("status", LEAD_STATUS.HOT).is("deleted_at", null),
    supabase.schema("customer").from("leads").select("id", { count: "exact", head: true }).eq("status", LEAD_STATUS.WARM).is("deleted_at", null),
    supabase.schema("customer").from("leads").select("id", { count: "exact", head: true }).eq("status", LEAD_STATUS.COLD).is("deleted_at", null),
  ]);

  return {
    hot: hotRes.error ? 0 : (hotRes.count ?? 0),
    warm: warmRes.error ? 0 : (warmRes.count ?? 0),
    cold: coldRes.error ? 0 : (coldRes.count ?? 0),
  };
}