import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PropertySummary } from "@/types/dashboard";

export async function getPropertySummary(
  _supabase: SupabaseClient<Database>
): Promise<PropertySummary> {
  return {
    available: 0,
    booked: 0,
    sold: 0,
    hold: 0,
  };
}