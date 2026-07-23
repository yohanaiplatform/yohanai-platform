// src/lib/dashboard/getRecentChats.ts

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
    .select(`
      id,
      lead_id,
      title,
      status,
      created_at,
      updated_at
    `)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(LIMITS.RECENT_CHATS);

  return {
    data: res.error
      ? null
      : (res.data ?? []).map(
          (row): RecentChat => ({
            id: row.id,
            lead_id: row.lead_id,
            title: row.title,
            status: row.status,
            unreadCount: 0,
            created_at: row.created_at,
            updated_at: row.updated_at,
          })
        ),
    error: !!res.error,
  };
}