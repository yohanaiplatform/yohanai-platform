// src/lib/dashboard/getPropertySummary.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { PropertySummary } from "@/types/dashboard";
import { PROPERTY_STATUS } from "@/constants/dashboard";

export async function getPropertySummary(supabase: SupabaseClient): Promise<PropertySummary> {
  const [availRes, bookedRes, soldRes, holdRes] = await Promise.all([
    supabase.schema("property").from("listings").select("id", { count: "exact", head: true }).eq("status", PROPERTY_STATUS.AVAILABLE).is("deleted_at", null),
    supabase.schema("property").from("listings").select("id", { count: "exact", head: true }).eq("status", PROPERTY_STATUS.BOOKED).is("deleted_at", null),
    supabase.schema("property").from("listings").select("id", { count: "exact", head: true }).eq("status", PROPERTY_STATUS.SOLD).is("deleted_at", null),
    supabase.schema("property").from("listings").select("id", { count: "exact", head: true }).eq("status", PROPERTY_STATUS.HOLD).is("deleted_at", null),
  ]);

  return {
    available: availRes.error ? 0 : (availRes.count ?? 0),
    booked: bookedRes.error ? 0 : (bookedRes.count ?? 0),
    sold: soldRes.error ? 0 : (soldRes.count ?? 0),
    hold: holdRes.error ? 0 : (holdRes.count ?? 0),
  };
}