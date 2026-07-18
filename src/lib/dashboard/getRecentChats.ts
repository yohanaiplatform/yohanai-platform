// src/lib/dashboard/getRecentChats.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { RecentChat } from "@/types/dashboard";
import { LIMITS } from "@/constants/dashboard";

export async function getRecentChats(supabase: SupabaseClient): Promise<{ data: RecentChat[] | null; error: boolean }> {
  const res = await supabase
    .schema("chat")
    .from("conversations")
    .select("id, customer_name, status, last_message_at")
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false })
    .limit(LIMITS.RECENT_CHATS);

  return {
    data: res.error ? null : (res.data as RecentChat[]),
    error: !!res.error,
  };
}