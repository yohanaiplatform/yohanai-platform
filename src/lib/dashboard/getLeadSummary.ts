// src/lib/dashboard/getLeadSummary.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { LeadSummary } from "@/types/dashboard";
import { LEAD_STATUS } from "@/constants/dashboard";

export async function getLeadSummary(
  supabase: SupabaseClient<Database>
): Promise<LeadSummary> {
  const [
    totalRes,
    todayRes,
    hotRes,
    warmRes,
    coldRes,
  ] = await Promise.all([
    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),

    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .is("deleted_at", null),

    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", LEAD_STATUS.HOT)
      .is("deleted_at", null),

    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", LEAD_STATUS.WARM)
      .is("deleted_at", null),

    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", LEAD_STATUS.COLD)
      .is("deleted_at", null),
  ]);

  const total = totalRes.count ?? 0;
  const newToday = todayRes.count ?? 0;

  return {
    total,
    newToday,
    conversionRate: 0,
    activeFollowUps: 0,
    hot: hotRes.count ?? 0,
    warm: warmRes.count ?? 0,
    cold: coldRes.count ?? 0,
  };
}