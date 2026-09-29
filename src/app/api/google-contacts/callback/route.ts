// src/app/api/google-contacts/callback/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getGoogleUserEmail } from "@/lib/google/contacts";

/**
 * Langkah 2 (terakhir) alur "Sambungkan Google Contacts". Google redirect
 * ke sini bawa `code`, ditukar ke refresh_token, DISIMPAN LANGSUNG ke
 * auth_ext.google_contacts_connections milik user yang sedang login --
 * beda dari desain awal (semalam) yang cuma menampilkan token di halaman
 * untuk di-copy manual. Personal per user, jadi tidak ada lagi langkah
 * copy-paste manual ke env var.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const settingsUrl = new URL("/settings", url.origin);

  if (oauthError) {
    settingsUrl.searchParams.set("google_contacts", "error");
    settingsUrl.searchParams.set("google_contacts_message", `Google menolak otorisasi: ${oauthError}`);
    return NextResponse.redirect(settingsUrl);
  }
  if (!code) {
    settingsUrl.searchParams.set("google_contacts", "error");
    settingsUrl.searchParams.set("google_contacts_message", "Parameter code kosong.");
    return NextResponse.redirect(settingsUrl);
  }

  const { accessToken, refreshToken, error: exchangeError } = await exchangeCodeForTokens(code);

  if (exchangeError) {
    settingsUrl.searchParams.set("google_contacts", "error");
    settingsUrl.searchParams.set("google_contacts_message", exchangeError);
    return NextResponse.redirect(settingsUrl);
  }

  if (!refreshToken) {
    // Google cuma kirim refresh_token di otorisasi pertama untuk kombinasi
    // client_id+akun Google ini. prompt=consent di /authorize seharusnya
    // selalu memaksa ini muncul -- kalau tetap kosong, minta user cabut
    // akses lama dulu di myaccount.google.com/permissions.
    settingsUrl.searchParams.set("google_contacts", "error");
    settingsUrl.searchParams.set(
      "google_contacts_message",
      "Google tidak mengirim refresh token. Cabut akses lama di myaccount.google.com/permissions (cari nama OAuth client-nya), lalu ulangi Sambungkan Google Contacts."
    );
    return NextResponse.redirect(settingsUrl);
  }

  const googleEmail = await getGoogleUserEmail(accessToken);

  const { error: dbError } = await supabase
    .schema("auth_ext")
    .from("google_contacts_connections")
    .upsert(
      { user_id: user.id, refresh_token: refreshToken, google_email: googleEmail },
      { onConflict: "user_id" }
    );

  if (dbError) {
    settingsUrl.searchParams.set("google_contacts", "error");
    settingsUrl.searchParams.set("google_contacts_message", `Gagal simpan koneksi: ${dbError.message}`);
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("google_contacts", "connected");
  return NextResponse.redirect(settingsUrl);
}
