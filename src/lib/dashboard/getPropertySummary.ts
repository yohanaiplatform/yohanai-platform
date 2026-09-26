import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PropertySummary } from "@/types/dashboard";

export async function getPropertySummary(
  supabase: SupabaseClient<Database>
): Promise<PropertySummary> {
  const { data, error } = await supabase
    .schema("property")
    .from("listings")
    .select("metadata")
    .is("deleted_at", null);

  if (error || !data) {
    return { total: 0, available: 0, reserved: 0, sold: 0, booked: 0, hold: 0 };
  }

  const summary = { total: data.length, available: 0, reserved: 0, sold: 0, booked: 0, hold: 0 };

  for (const row of data) {
    const status =
      typeof row.metadata === "object" && row.metadata !== null && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>).status
        : null;

    if (status === "available") summary.available += 1;
    else if (status === "booked") summary.booked += 1;
    else if (status === "sold") summary.sold += 1;
    else if (status === "hold") summary.hold += 1;
  }

  return summary;
}
