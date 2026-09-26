// src/lib/crm/getLeadConversation.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ChatMessage } from "@/components/shared/ChatMessageList";

export interface GetLeadConversationResult {
  conversationId: string | null;
  data: ChatMessage[];
  error: boolean;
}

/** Riwayat pesan WhatsApp untuk 1 lead, urut lama -> baru (gaya thread chat). */
export async function getLeadConversation(
  supabase: SupabaseClient<Database>,
  leadId: string
): Promise<GetLeadConversationResult> {
  const { data: conversation, error: convError } = await supabase
    .schema("chat")
    .from("conversations")
    .select("id")
    .eq("lead_id", leadId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (convError) {
    return { conversationId: null, data: [], error: true };
  }

  if (!conversation) {
    return { conversationId: null, data: [], error: false };
  }

  const { data: messages, error: messagesError } = await supabase
    .schema("chat")
    .from("messages")
    .select("id, sender_type, content, created_at")
    .eq("conversation_id", conversation.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return { conversationId: conversation.id, data: [], error: true };
  }

  return { conversationId: conversation.id, data: messages, error: false };
}
