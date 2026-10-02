// src/app/api/whatsapp-numbers/request/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";
import { getAdminUserIds } from "@/lib/notifications/getAdminUserIds";

/**
 * User non-admin ajukan nomor WhatsApp baru dari Settings (Kapso free tier
 * cuma izinkan 1 nomor, jadi tidak bisa didaftarkan otomatis dari app --
 * admin perlu setup manual di Kapso, kemungkinan sekalian upgrade plan,
 * dulu). Pola sama persis seperti POST /api/google-contacts/request-access:
 * insert baris pending (kalau belum ada), notifikasi in-app ke semua admin,
 * DITAMBAH email (Resend) supaya admin tidak perlu buka app dulu untuk tahu
 * ada permintaan baru.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const phoneNumber: string | undefined = body?.phoneNumber?.trim();

  if (!phoneNumber) {
    return NextResponse.json({ error: "Nomor WhatsApp wajib diisi" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .schema("chat")
    .from("whatsapp_number_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, status: "pending" });
  }

  const { error: insertError } = await supabase
    .schema("chat")
    .from("whatsapp_number_requests")
    .insert({ user_id: user.id, phone_number: phoneNumber, status: "pending" });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const supabaseAdmin = createAdminClient();
  const admins = await getAdminUserIds(supabaseAdmin);

  await Promise.all(
    admins.map((admin) =>
      createNotification(supabaseAdmin, {
        recipientId: admin.userId,
        type: "whatsapp_number_request",
        title: "Permintaan nomor WhatsApp baru",
        body: `${user.email} minta nomor WhatsApp ${phoneNumber} didaftarkan ke Kapso.`,
        link: "/settings",
        metadata: { requestingUserId: user.id, requestingUserEmail: user.email, phoneNumber },
      })
    )
  );

  // Email ke admin -- best-effort, kegagalan kirim email tidak boleh
  // menggagalkan permintaan yang sudah tersimpan (notifikasi in-app sudah
  // cukup sebagai fallback kalau Resend bermasalah).
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    await Promise.all(
      admins.map((admin) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [admin.email],
            subject: "Yohan.AI -- Permintaan Nomor WhatsApp Baru",
            html: `<p>${user.email} minta nomor WhatsApp <strong>${phoneNumber}</strong> didaftarkan ke Kapso.</p><p>Daftarkan nomor itu secara manual di Kapso (cek dulu apakah perlu upgrade plan), lalu buka <a href="https://yohanai.id/settings">Settings</a> untuk isi Phone Number ID aslinya dan setujui permintaan ini.</p>`,
          }),
        }).catch(() => null)
      )
    );
  }

  return NextResponse.json({ success: true, status: "pending" });
}
