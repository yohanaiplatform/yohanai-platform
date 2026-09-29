// src/app/api/google-contacts/authorize/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CONTACTS_SCOPES } from "@/lib/google/contacts";

/**
 * Langkah 1 alur "Sambungkan Google Contacts" (tombol di halaman
 * Settings). Personal per user (29 September 2026) -- SIAPA PUN yang
 * login boleh sambungkan akun Google pribadinya sendiri, bukan admin-only
 * seperti desain awal (semalam, waktu masih 1 akun terpusat).
 *
 * User dilempar ke consent screen Google -> setuju -> mendarat di
 * /callback yang menyimpan refresh token ke baris miliknya sendiri di
 * auth_ext.google_contacts_connections.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  authUrl.searchParams.set("scope", CONTACTS_SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  // prompt=consent WAJIB -- tanpa ini Google cuma balas refresh_token di
  // otorisasi PERTAMA kali seumur hidup client_id ini per akun Google.
  // Kalau user reconnect (mis. token dicabut manual), prompt=consent
  // memaksa muncul lagi supaya kita dapat refresh_token baru.
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authUrl.toString());
}
