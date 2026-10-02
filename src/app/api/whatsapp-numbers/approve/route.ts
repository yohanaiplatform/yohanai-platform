// src/app/api/whatsapp-numbers/approve/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";

/**
 * Admin klik "Setujui" di permintaan nomor WhatsApp -- DIPANGGIL SETELAH
 * admin sudah mendaftarkan nomor itu secara manual di Kapso (aplikasi tidak
 * bisa melakukan itu otomatis, batasan Kapso/Meta -- nomor WA Business
 * butuh verifikasi OTP ke nomor fisiknya, bukan sekadar API call). Endpoint
 * ini membuat/update baris chat.whatsapp_numbers dengan phone_number_id
 * ASLI dari Kapso (+ webhook_secret kalau nomor itu dapat secret berbeda --
 * Kapso auto-generate per nomor), menandai permintaan approved, dan kasih
 * tahu balik ke user yang minta.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.schema("core").rpc("is_admin_or_above");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const requestId: string | undefined = body?.requestId;
  const phoneNumberId: string | undefined = body?.phoneNumberId?.trim();
  const webhookSecret: string | undefined = body?.webhookSecret?.trim();
  const label: string | undefined = body?.label?.trim();

  if (!requestId || !phoneNumberId) {
    return NextResponse.json({ error: "requestId dan phoneNumberId wajib diisi" }, { status: 400 });
  }

  const { data: numberRequest, error: requestError } = await supabase
    .schema("chat")
    .from("whatsapp_number_requests")
    .select("id, user_id, phone_number, status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !numberRequest) {
    return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
  }

  const { error: upsertError } = await supabase
    .schema("chat")
    .from("whatsapp_numbers")
    .insert({
      phone_number_id: phoneNumberId,
      label: label || numberRequest.phone_number,
      assigned_to: numberRequest.user_id,
      webhook_secret: webhookSecret || null,
      created_by: user.id,
    });

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message || "Gagal menyimpan nomor (mungkin Phone Number ID sudah terdaftar)" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .schema("chat")
    .from("whatsapp_number_requests")
    .update({ status: "approved", resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const supabaseAdmin = createAdminClient();
  await createNotification(supabaseAdmin, {
    recipientId: numberRequest.user_id,
    type: "whatsapp_number_approved",
    title: "Nomor WhatsApp Anda sudah aktif",
    body: `Nomor ${numberRequest.phone_number} sudah didaftarkan dan siap dipakai.`,
    link: "/settings",
  });

  return NextResponse.json({ success: true });
}
