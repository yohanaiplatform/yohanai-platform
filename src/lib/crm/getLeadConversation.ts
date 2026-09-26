// src/lib/crm/getLeadConversation.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface LeadChatMessage {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

export interface GetLeadConversationResult {
  data: LeadChatMessage[];
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
    return { data: [], error: true };
  }

  if (!conversation) {
    return { data: [], error: false };
  }

  const { data: messages, error: messagesError } = await supabase
    .schema("chat")
    .from("messages")
    .select("id, sender_type, content, created_at")
    .eq("conversation_id", conversation.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return { data: [], error: true };
  }

  return { data: messages, error: false };
}
