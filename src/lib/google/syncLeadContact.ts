// src/lib/google/syncLeadContact.ts

import { createGoogleContact } from "@/lib/google/contacts";

export interface LeadForContactSync {
  first_name: string;
  last_name?: string | null;
  phone: string;
  email?: string | null;
}

/**
 * Sync satu lead ke Google Contacts MILIK USER YANG BIKIN LEAD ITU --
 * dipanggil dari POST /api/leads/[id]/sync-contact setelah createLead.ts
 * (Tambah Lead Manual) sukses, pakai refresh_token milik user tersebut
 * dari auth_ext.google_contacts_connections.
 *
 * Personal per user (29 September 2026) -- desain awal (semalam) pakai
 * satu akun Google terpusat, diubah karena Yohan mau tiap user (termasuk
 * agent lain nanti) lihat kontak lead-nya di Google Contacts & HP mereka
 * SENDIRI, bukan satu akun bersama.
 *
 * Sengaja fire-and-forget di pemanggil: gagal sync kontak TIDAK BOLEH
 * menggagalkan penyimpanan lead itu sendiri (lead adalah data utama,
 * Google Contacts cuma turunan).
 */
export async function syncLeadToGoogleContacts(refreshToken: string, lead: LeadForContactSync): Promise<void> {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || lead.first_name;

  const { error } = await createGoogleContact(refreshToken, {
    name,
    phone: lead.phone,
    email: lead.email,
    note: "Dibuat otomatis oleh Yohan.AI Platform dari lead baru.",
  });

  if (error) {
    console.error(`[google-contacts] Gagal sync lead "${name}" (${lead.phone}): ${error}`);
  }
}
