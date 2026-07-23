import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { RecentChat } from "@/types/dashboard";
import { LIMITS } from "@/constants/dashboard";

export async function getRecentChats(
  supabase: SupabaseClient<Database>
): Promise<{ data: RecentChat[] | null; error: boolean }> {
  const res = await supabase
    .schema("chat")
    .from("conversations")
    .select("id, title, status, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(LIMITS.RECENT_CHATS);

  return {
    data: res.error
      ? null
      : res.data.map((row) => ({
          id: row.id,
          customer_name: row.title ?? "Untitled",
          status: row.status,
          last_message_at: row.updated_at,
        })),
    error: !!res.error,
  };
}