// src/app/api/google-contacts/callback/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Langkah 2 (terakhir) setup Google Contacts. Google redirect ke sini
 * bawa `code`, ditukar ke refresh_token, ditampilkan sekali di halaman ini
 * untuk di-copy manual ke env var GOOGLE_CONTACTS_REFRESH_TOKEN (di Vercel
 * & .env.local) -- TIDAK disimpan otomatis di mana pun oleh aplikasi ini,
 * karena tidak ada tempat penyimpanan config selain env var di project ini.
 */
export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.json({ error: `Google menolak otorisasi: ${oauthError}` }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "Parameter code kosong." }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CONTACTS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CONTACTS_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CONTACTS_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "GOOGLE_CONTACTS_CLIENT_ID/SECRET/REDIRECT_URI belum diisi di env var." },
      { status: 500 }
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json({ error: `Tukar token gagal: ${JSON.stringify(tokenData)}` }, { status: 500 });
  }

  if (!tokenData.refresh_token) {
    return new NextResponse(
      `<p>Google tidak mengirim refresh_token kali ini -- biasanya karena akun ini sudah pernah otorisasi client_id yang sama sebelumnya.</p>
       <p>Cabut akses lama dulu di <a href="https://myaccount.google.com/permissions" target="_blank">myaccount.google.com/permissions</a> (cari nama OAuth client-nya), lalu ulangi dari /api/google-contacts/authorize.</p>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    `<!doctype html><html><body style="font-family:system-ui;max-width:640px;margin:40px auto;line-height:1.6">
      <h2>Refresh token berhasil didapat</h2>
      <p>Copy nilai di bawah ini ke env var <code>GOOGLE_CONTACTS_REFRESH_TOKEN</code> di Vercel (Project Settings -> Environment Variables) dan di <code>.env.local</code>. Halaman ini tidak menyimpannya di mana pun -- kalau ditutup tanpa di-copy, ulangi dari /api/google-contacts/authorize.</p>
      <textarea readonly style="width:100%;height:80px;font-family:monospace;padding:8px">${tokenData.refresh_token}</textarea>
      <p>Setelah disimpan di Vercel, redeploy (atau tunggu deploy berikutnya) supaya env var-nya aktif.</p>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
