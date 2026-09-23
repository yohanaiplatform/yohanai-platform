// src/lib/dashboard/getLeadSummary.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { LeadSummary } from "@/types/dashboard";

/**
 * "Temperature" (Hot/Warm/Cold) BUKAN kolom leads.status (itu pipeline
 * new/contacted/.../won/lost). Untuk lead dari Google Form legacy,
 * temperature aslinya ada di metadata->>status_funnel_awal (field
 * "Status Funnel" di form: Cold/Warm/Hot/Closing). leads.status selalu
 * "new" untuk lead hasil intake Fase 1 -- filter ke kolom itu akan
 * selalu menghasilkan 0.
 */
export async function getLeadSummary(
  supabase: SupabaseClient<Database>
): Promise<LeadSummary> {
  const [
    totalRes,
    todayRes,
    hotRes,
    warmRes,
    coldRes,
    closingRes,
    batalRes,
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
      .ilike("metadata->>status_funnel_awal", "hot")
      .is("deleted_at", null),

    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .ilike("metadata->>status_funnel_awal", "warm")
      .is("deleted_at", null),

    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .ilike("metadata->>status_funnel_awal", "cold")
      .is("deleted_at", null),

    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .ilike("metadata->>status_funnel_awal", "closing")
      .is("deleted_at", null),

    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .ilike("metadata->>status_funnel_awal", "batal")
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
    closing: closingRes.count ?? 0,
    batal: batalRes.count ?? 0,
  };
}
