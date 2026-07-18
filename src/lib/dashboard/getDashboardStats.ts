// src/lib/dashboard/getDashboardStats.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { DashboardStats } from "@/types/dashboard";

export async function getDashboardStats(supabase: SupabaseClient): Promise<DashboardStats> {
  const today = new Date();
  const todayISO = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString();

  const [totalLeadsRes, activeChatsRes, totalPropertiesRes, todayLeadsRes] = await Promise.all([
    supabase.schema("customer").from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.schema("chat").from("conversations").select("id", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
    supabase.schema("property").from("listings").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.schema("customer").from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", todayISO),
  ]);

  return {
    totalLeads: totalLeadsRes.error ? 0 : (totalLeadsRes.count ?? 0),
    activeChats: activeChatsRes.error ? 0 : (activeChatsRes.count ?? 0),
    totalProperties: totalPropertiesRes.error ? 0 : (totalPropertiesRes.count ?? 0),
    todayLeads: todayLeadsRes.error ? 0 : (todayLeadsRes.count ?? 0),
  };
}