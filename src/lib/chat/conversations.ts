// src/lib/chat/conversations.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cari conversation aktif untuk 1 lead, atau buat baru kalau belum ada.
 * Dipakai POST /api/whatsapp/webhook (pesan masuk) dan POST /api/whatsapp/send
 * (balasan keluar) supaya keduanya menulis ke thread yang sama.
 *
 * phoneNumberId (opsional) -- nomor WA Kapso yang dipakai lead ini chat,
 * disimpan di metadata CUMA saat conversation baru dibuat (sekali, tidak
 * pernah diubah lagi setelahnya) -- jadi acuan nomor pengirim yang benar
 * saat balas nanti (lihat src/lib/whatsapp/kapso.ts), tidak perlu
 * diasumsikan ulang dari assigned_to tiap kali ada balasan baru.
 */
export async function findOrCreateLeadConversation(
  supabase: SupabaseClient<Database>,
  leadId: string,
  fallbackTitle: string,
  phoneNumberId?: string | null
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
    .insert({
      lead_id: leadId,
      title: fallbackTitle,
      status: "active",
      metadata: phoneNumberId ? { phone_number_id: phoneNumberId } : {},
    })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}
