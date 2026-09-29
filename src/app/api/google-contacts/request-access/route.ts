// src/app/api/google-contacts/request-access/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";
import { getAdminUserIds } from "@/lib/notifications/getAdminUserIds";

/**
 * User klik "Ajukan Akses" di Settings setelah gagal connect Google
 * Contacts (Google consent screen masih mode "Testing" -- cuma email yang
 * sudah ditambahkan manual sebagai test user di Google Cloud Console yang
 * bisa lewat). Insert baris pending (kalau belum ada), lalu broadcast
 * notifikasi in-app ke semua admin lewat service-role client (RLS
 * core.notifications tidak kasih INSERT ke authenticated).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .schema("auth_ext")
    .from("google_contacts_access_requests")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, status: existing.status });
  }

  const { error: insertError } = await supabase
    .schema("auth_ext")
    .from("google_contacts_access_requests")
    .insert({ user_id: user.id, status: "pending" });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const supabaseAdmin = createAdminClient();
  const admins = await getAdminUserIds(supabaseAdmin);

  await Promise.all(
    admins.map((admin) =>
      createNotification(supabaseAdmin, {
        recipientId: admin.userId,
        type: "google_contacts_access_request",
        title: "Permintaan akses Google Contacts",
        body: `${user.email} minta ditambahkan sebagai test user Google OAuth supaya bisa sambungkan Google Contacts.`,
        link: "/settings",
        metadata: { requestingUserId: user.id, requestingUserEmail: user.email },
      })
    )
  );

  return NextResponse.json({ success: true, status: "pending" });
}
