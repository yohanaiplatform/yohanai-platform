// src/lib/google/syncLeadContact.ts

import { createGoogleContact } from "@/lib/google/contacts";

export interface LeadForContactSync {
  first_name: string;
  last_name?: string | null;
  phone: string;
  email?: string | null;
}

/**
 * Sync satu lead baru ke Google Contacts (akun yohan.ai.platform@gmail.com).
 * Dipanggil dari kedua jalur insert lead -- POST /api/leads/intake (Google
 * Form) dan createLead.ts (Tambah Lead Manual, lewat route terpisah karena
 * createLead.ts jalan di browser -- lihat /api/leads/[id]/sync-contact).
 *
 * Sengaja fire-and-forget di kedua pemanggil: gagal sync kontak TIDAK BOLEH
 * menggagalkan penyimpanan lead itu sendiri (lead adalah data utama, Google
 * Contacts cuma turunan). Kalau GOOGLE_CONTACTS_REFRESH_TOKEN belum
 * dikonfigurasi, fungsi ini diam-diam no-op (dianggap fitur belum diaktifkan,
 * bukan error).
 */
export async function syncLeadToGoogleContacts(lead: LeadForContactSync): Promise<void> {
  if (!process.env.GOOGLE_CONTACTS_REFRESH_TOKEN) return;

  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || lead.first_name;

  const { error } = await createGoogleContact({
    name,
    phone: lead.phone,
    email: lead.email,
    note: "Dibuat otomatis oleh Yohan.AI Platform dari lead baru.",
  });

  if (error) {
    console.error(`[google-contacts] Gagal sync lead "${name}" (${lead.phone}): ${error}`);
  }
}
