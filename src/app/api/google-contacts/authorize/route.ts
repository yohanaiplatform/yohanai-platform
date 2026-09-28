// src/app/api/google-contacts/authorize/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Langkah 1 dari setup Google Contacts (sekali jalan, bukan dipanggil
 * aplikasi terus-menerus). Admin buka URL ini di browser -> dilempar ke
 * consent screen Google -> setuju -> mendarat di /callback yang menampilkan
 * refresh token buat di-copy ke env var. Lihat docs/modules/crm.mdx bagian
 * "Google Contacts" untuk panduan lengkap.
 *
 * Admin-only -- deteksi lewat core.list_assignable_users() (pola sama
 * seperti PropertyAssignSelect.tsx/AddListingForm.tsx: array kosong = bukan
 * admin/super_admin).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: assignable } = await supabase.schema("core").rpc("list_assignable_users");
  if (!assignable || assignable.length === 0) {
    return NextResponse.json({ error: "Khusus admin/super_admin." }, { status: 403 });
  }

  const clientId = process.env.GOOGLE_CONTACTS_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CONTACTS_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "GOOGLE_CONTACTS_CLIENT_ID / GOOGLE_CONTACTS_REDIRECT_URI belum diisi di env var." },
      { status: 500 }
    );
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/contacts");
  authUrl.searchParams.set("access_type", "offline");
  // prompt=consent WAJIB -- tanpa ini Google cuma balas refresh_token di
  // otorisasi PERTAMA kali seumur hidup client_id ini. Kalau nanti perlu
  // generate ulang (mis. token dicabut), prompt=consent memaksa muncul lagi.
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authUrl.toString());
}
