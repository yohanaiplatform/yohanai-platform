// src/app/api/leads/[id]/sync-contact/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncLeadById } from "@/lib/google/syncLeadContact";

/**
 * Sinkronkan satu lead ke Google Contacts. Dipanggil dari AddLeadForm,
 * simpan "Edit Nama/Kontak", dan tombol "Sinkronkan ke Google Contacts" di
 * Lead Detail. Token Google tidak boleh sampai ke browser, jadi sinkron
 * berjalan di sini lewat service-role; sesi login hanya dipakai untuk
 * memastikan pemanggil memang boleh melihat lead itu (RLS
 * `leads_owner_or_admin`). Kontak masuk ke akun Google agen yang ditugaskan
 * ke lead (fallback: akun pemanggil bila lead belum punya agen).
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

  const { data: visible } = await supabase.schema("customer").from("leads").select("id").eq("id", id).maybeSingle();
  if (!visible) {
    return NextResponse.json({ error: "Lead tidak ditemukan" }, { status: 404 });
  }

  const result = await syncLeadById(createAdminClient(), id, user.id);

  return NextResponse.json({
    success: result.status !== "error",
    status: result.status,
    synced: result.status === "created" || result.status === "updated" || result.status === "unchanged",
    ...(result.status === "error" ? { error: result.message } : {}),
  });
}
