// src/lib/notifications/createNotification.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface CreateNotificationInput {
  recipientId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Json;
}

/**
 * Menulis notifikasi in-app untuk USER LAIN dari user yang sedang login --
 * karena itu wajib pakai client service-role (createAdminClient()), bukan
 * client sesi biasa (RLS core.notifications sengaja tidak kasih INSERT ke
 * authenticated, lihat migration 048).
 */
export async function createNotification(
  supabaseAdmin: SupabaseClient<Database>,
  input: CreateNotificationInput
): Promise<void> {
  const { error } = await supabaseAdmin.schema("core").from("notifications").insert({
    recipient_id: input.recipientId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Gagal membuat notifikasi:", error.message);
  }
}
