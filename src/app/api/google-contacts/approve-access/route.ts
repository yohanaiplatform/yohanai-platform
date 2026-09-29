// src/app/api/google-contacts/approve-access/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";

/**
 * Admin klik "Setujui" di notifikasi permintaan akses Google Contacts --
 * DIPANGGIL SETELAH admin sudah menambahkan manual email user itu sebagai
 * test user di Google Cloud Console (aplikasi tidak bisa melakukan itu
 * secara otomatis, batasan Google). Endpoint ini cuma menandai status
 * approved di app + kasih tahu balik ke user yang minta.
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
  const targetUserId: string | undefined = body?.userId;

  if (!targetUserId) {
    return NextResponse.json({ error: "userId wajib diisi" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .schema("auth_ext")
    .from("google_contacts_access_requests")
    .update({ status: "approved", resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("user_id", targetUserId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const supabaseAdmin = createAdminClient();
  await createNotification(supabaseAdmin, {
    recipientId: targetUserId,
    type: "google_contacts_access_approved",
    title: "Akses Google Contacts disetujui",
    body: "Admin sudah menambahkan Anda sebagai test user. Silakan coba Sambungkan Google Contacts lagi di Settings.",
    link: "/settings",
  });

  return NextResponse.json({ success: true });
}
