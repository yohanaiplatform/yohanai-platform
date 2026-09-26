// src/lib/chat/conversations.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cari conversation aktif untuk 1 lead, atau buat baru kalau belum ada.
 * Dipakai POST /api/whatsapp/webhook (pesan masuk) dan POST /api/whatsapp/send
 * (balasan keluar) supaya keduanya menulis ke thread yang sama.
 */
export async function findOrCreateLeadConversation(
  supabase: SupabaseClient<Database>,
  leadId: string,
  fallbackTitle: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .schema("chat")
    .from("conversations")
    .select("id")
    .eq("lead_id", leadId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id;

  const { data: created, error } = await supabase
    .schema("chat")
    .from("conversations")
    .insert({ lead_id: leadId, title: fallbackTitle, status: "active", metadata: {} })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}
