// src/lib/whatsapp/whatsappNumbers.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Pemilik default untuk lead baru dari nomor WA ini (dipakai webhook/route.ts
 * saat buat lead otomatis). Gantikan env var WHATSAPP_DEFAULT_ASSIGNEE_USER_ID
 * yang cuma dukung 1 nomor -- lihat migration 056.
 */
export async function getAssigneeForPhoneNumberId(
  supabase: SupabaseClient<Database>,
  phoneNumberId: string
): Promise<string | null> {
  const { data } = await supabase
    .schema("chat")
    .from("whatsapp_numbers")
    .select("assigned_to")
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  return data?.assigned_to ?? null;
}

/**
 * Nomor WA terdaftar milik seorang user -- dipakai sebagai FALLBACK saat
 * balas ke lead yang belum pernah punya percakapan WA sebelumnya (jadi
 * belum ada chat.conversations.metadata.phone_number_id buat dijadikan
 * acuan nomor pengirim). Kalau user punya lebih dari 1 nomor terdaftar,
 * ambil yang pertama -- kasus langka, belum perlu UI pilih salah satu.
 */
export async function getPhoneNumberIdForUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .schema("chat")
    .from("whatsapp_numbers")
    .select("phone_number_id")
    .eq("assigned_to", userId)
    .limit(1)
    .maybeSingle();

  return data?.phone_number_id ?? null;
}
