import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PropertySummary } from "@/types/dashboard";

export async function getPropertySummary(
  _supabase: SupabaseClient<Database>
): Promise<PropertySummary> {
  return {
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    booked: 0,
    hold: 0,
  };
}