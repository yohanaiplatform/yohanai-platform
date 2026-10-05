// src/lib/google/syncLeadContact.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import { createGoogleContact, updateGoogleContact } from "@/lib/google/contacts";
import type { Json } from "@/types/database";

export type LeadSyncResult =
  | { status: "created" | "updated" | "unchanged" }
  | { status: "no_connection" | "no_phone" | "not_found" }
  | { status: "error"; message: string };

/** Nomor ke format internasional (+62...) supaya WhatsApp/HP mencocokkan kontaknya. */
export function toInternationalPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  return `+${digits}`;
}

/**
 * Sinkronkan satu lead ke Google Contacts milik agen yang DITUGASKAN ke lead
 * itu (fallback: `fallbackUserId`, mis. user yang menekan tombol). Idempoten:
 * resourceName kontak disimpan di `metadata.google_contact`, jadi pemanggilan
 * berikutnya memperbarui kontak yang sama (bukan membuat dobel), dan dilewati
 * kalau nama/telepon/email tidak berubah. Dipakai dari webhook WhatsApp, AI
 * Agent (nama terkonfirmasi), Tambah Lead, simpan Edit Nama/Kontak, dan
 * tombol manual di Lead Detail. Wajib client service-role.
 *
 * Gagal sinkron TIDAK BOLEH menggagalkan pemanggil -- hasilnya dikembalikan
 * sebagai status, tidak pernah melempar.
 */
export async function syncLeadById(
  admin: SupabaseClient,
  leadId: string,
  fallbackUserId?: string | null
): Promise<LeadSyncResult> {
  try {
    const { data: lead } = await admin
      .schema("customer")
      .from("leads")
      .select("first_name, last_name, phone, email, assigned_to, metadata")
      .eq("id", leadId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!lead) return { status: "not_found" };
    if (!lead.phone) return { status: "no_phone" };

    const ownerId = lead.assigned_to ?? fallbackUserId;
    if (!ownerId) return { status: "no_connection" };

    const { data: connection } = await admin
      .schema("auth_ext")
      .from("google_contacts_connections")
      .select("refresh_token")
      .eq("user_id", ownerId)
      .maybeSingle();
    if (!connection) return { status: "no_connection" };

    const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || lead.first_name;
    const phone = toInternationalPhone(lead.phone);
    const email = lead.email || null;

    const metadata =
      lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata)
        ? (lead.metadata as Record<string, Json>)
        : {};
    const synced = metadata.google_contact as
      | { resourceName?: string; name?: string; phone?: string; email?: string | null; owner?: string }
      | undefined;

    const input = { name, phone, email, note: "Dibuat otomatis oleh Yohan.AI Platform dari lead baru." };
    let resourceName = synced?.resourceName ?? null;
    let status: "created" | "updated" = "created";

    if (synced && resourceName && synced.owner === ownerId) {
      if (synced.name === name && synced.phone === phone && (synced.email ?? null) === email) {
        return { status: "unchanged" };
      }
      const upd = await updateGoogleContact(connection.refresh_token, resourceName, input);
      if (upd.error) return { status: "error", message: upd.error };
      if (upd.notFound) resourceName = null;
      else status = "updated";
    } else {
      resourceName = null;
    }

    if (!resourceName) {
      const created = await createGoogleContact(connection.refresh_token, input);
      if (created.error || !created.resourceName) {
        return { status: "error", message: created.error ?? "Kontak tidak terbuat" };
      }
      resourceName = created.resourceName;
      status = "created";
    }

    await admin
      .schema("customer")
      .from("leads")
      .update({
        metadata: {
          ...metadata,
          google_contact: { resourceName, name, phone, email, owner: ownerId, syncedAt: new Date().toISOString() },
        },
      })
      .eq("id", leadId);

    return { status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal sinkron kontak";
    console.error(`[google-contacts] Gagal sync lead ${leadId}: ${message}`);
    return { status: "error", message };
  }
}
