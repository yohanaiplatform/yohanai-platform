// src/lib/dashboard/getDashboardStats.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { DashboardStats } from "@/types/dashboard";

export async function getDashboardStats(
  supabase: SupabaseClient<Database>
): Promise<DashboardStats> {
  const today = new Date();
  const todayISO = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  ).toISOString();

  const [
    totalLeadsRes,
    activeChatsRes,
    totalPropertiesRes,
    todayLeadsRes,
  ] = await Promise.all([
    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),

    supabase
      .schema("chat")
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("deleted_at", null),

    supabase
      .schema("property")
      .from("listings")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),

    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", todayISO),
  ]);

  return {
    totalLeads: totalLeadsRes.count ?? 0,
    activeChats: activeChatsRes.count ?? 0,
    totalProperties: totalPropertiesRes.count ?? 0,
    todayLeads: todayLeadsRes.count ?? 0,
  };
}