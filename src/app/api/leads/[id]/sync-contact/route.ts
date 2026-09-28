// src/app/api/leads/[id]/sync-contact/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncLeadToGoogleContacts } from "@/lib/google/syncLeadContact";

/**
 * Sync satu lead ke Google Contacts, dipanggil dari AddLeadForm.tsx setelah
 * createLead() sukses -- createLead.ts jalan di browser (butuh RLS session
 * client), sementara Google Contacts butuh secret (refresh token) yang tidak
 * boleh sampai ke browser, jadi perlu route terpisah ini.
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

  const { data: lead, error } = await supabase
    .schema("customer")
    .from("leads")
    .select("first_name, last_name, phone, email")
    .eq("id", id)
    .maybeSingle();

  if (error || !lead || !lead.phone) {
    return NextResponse.json({ error: "Lead tidak ditemukan" }, { status: 404 });
  }

  await syncLeadToGoogleContacts({ ...lead, phone: lead.phone });

  return NextResponse.json({ success: true });
}
