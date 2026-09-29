// src/app/api/leads/[id]/sync-contact/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncLeadToGoogleContacts } from "@/lib/google/syncLeadContact";

/**
 * Sync satu lead ke Google Contacts MILIK USER YANG LOGIN, dipanggil dari
 * AddLeadForm.tsx setelah createLead() sukses -- createLead.ts jalan di
 * browser (butuh RLS session client), sementara token Google (refresh
 * token) tidak boleh sampai ke browser, jadi perlu route terpisah ini.
 *
 * Personal per user (29 September 2026) -- no-op diam-diam kalau user ini
 * belum sambungkan akun Google-nya sendiri lewat halaman Settings
 * (auth_ext.google_contacts_connections belum ada baris untuk dia).
 *
 * Sesi login biasa (bukan admin-only) -- RLS `leads_owner_or_admin` di
 * bawahnya sudah membatasi lead mana saja yang bisa dibaca pemanggil.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connection } = await supabase
    .schema("auth_ext")
    .from("google_contacts_connections")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!connection) {
    // Belum sambungkan Google Contacts sama sekali -- bukan error, cuma belum aktif.
    return NextResponse.json({ success: true, synced: false });
  }

  const { data: lead, error } = await supabase
    .schema("customer")
    .from("leads")
    .select("first_name, last_name, phone, email")
    .eq("id", id)
    .maybeSingle();

  if (error || !lead || !lead.phone) {
    return NextResponse.json({ error: "Lead tidak ditemukan" }, { status: 404 });
  }

  await syncLeadToGoogleContacts(connection.refresh_token, { ...lead, phone: lead.phone });

  return NextResponse.json({ success: true, synced: true });
}
