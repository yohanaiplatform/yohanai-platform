// src/lib/google/contacts.ts

/**
 * Google People API client (server-only). Personal per user (29 September
 * 2026) -- tiap user sambungkan akun Google PRIBADI mereka sendiri lewat
 * /api/google-contacts/authorize, refresh token-nya disimpan di
 * auth_ext.google_contacts_connections (satu baris per user_id). Lead yang
 * mereka input manual otomatis jadi kontak di Google Contacts & HP mereka
 * sendiri -- BUKAN satu akun terpusat seperti desain awal (semalam).
 *
 * OAuth2 refresh-token flow -- bukan service account, karena akun Google
 * tiap user adalah akun Gmail pribadi biasa (bukan Workspace), tidak bisa
 * pakai domain-wide delegation.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PEOPLE_API_BASE = "https://people.googleapis.com/v1";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

/** contacts = tulis kontak. email+profile = buat tampilkan "terhubung sebagai xxx@gmail.com" di UI. */
export const CONTACTS_SCOPES = [
  "https://www.googleapis.com/auth/contacts",
  "email",
  "profile",
].join(" ");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum dikonfigurasi.`);
  return value;
}

/** Tukar authorization code (dari /callback) jadi access + refresh token. */
export async function exchangeCodeForTokens(
  code: string
): Promise<{ accessToken: string; refreshToken: string | null; error: string | null }> {
  const clientId = requireEnv("GOOGLE_CONTACTS_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CONTACTS_CLIENT_SECRET");
  const redirectUri = requireEnv("GOOGLE_CONTACTS_REDIRECT_URI");

  const res = await fetch(TOKEN_URL, {
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

  if (!res.ok) {
    const body = await res.text();
    return { accessToken: "", refreshToken: null, error: `Tukar token gagal: ${body}` };
  }

  const data = await res.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, error: null };
}

/** Ambil email akun Google yang baru saja otorisasi -- dipanggil sekali di /callback, pakai access token dari exchangeCodeForTokens(). */
export async function getGoogleUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.email ?? null;
}

/** Tukar refresh token (disimpan per user) dengan access token baru -- access token cuma berumur ~1 jam, selalu minta baru per panggilan, volume rendah jadi tidak perlu cache. */
async function getAccessTokenFromRefreshToken(refreshToken: string): Promise<string> {
  const clientId = requireEnv("GOOGLE_CONTACTS_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CONTACTS_CLIENT_SECRET");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gagal refresh token Google Contacts: ${body}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export interface ContactInput {
  name: string;
  phone: string;
  email?: string | null;
  /** Ditaruh di field notes kontak -- supaya gampang ditelusuri asalnya dari YohanAI. */
  note?: string;
}

/**
 * Buat kontak baru di Google Contacts MILIK USER TERTENTU (refreshToken
 * miliknya, bukan token global). Sengaja TIDAK cek duplikat dulu (People
 * API tidak punya pencarian-by-phone yang murah tanpa warmup index) --
 * risiko dobel kontak rendah karena ini cuma dipanggil sekali per lead
 * baru (dedup lead-nya sendiri sudah terjadi di customer.leads).
 */
export async function createGoogleContact(
  refreshToken: string,
  input: ContactInput
): Promise<{ resourceName: string | null; error: string | null }> {
  let accessToken: string;
  try {
    accessToken = await getAccessTokenFromRefreshToken(refreshToken);
  } catch (err) {
    return { resourceName: null, error: err instanceof Error ? err.message : "Gagal ambil access token" };
  }

  const res = await fetch(`${PEOPLE_API_BASE}/people:createContact`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      names: [{ givenName: input.name }],
      phoneNumbers: [{ value: input.phone, type: "mobile" }],
      ...(input.email ? { emailAddresses: [{ value: input.email }] } : {}),
      ...(input.note ? { biographies: [{ value: input.note, contentType: "TEXT_PLAIN" }] } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { resourceName: null, error: `Google People API error: ${body}` };
  }

  const data = await res.json();
  return { resourceName: data.resourceName ?? null, error: null };
}

/**
 * Perbarui kontak yang sudah pernah dibuat (nama/telepon/email). People API
 * mewajibkan etag terbaru, jadi kontak dibaca dulu. Mengembalikan notFound
 * kalau kontaknya sudah dihapus pemiliknya di Google (pemanggil lalu buat baru).
 */
export async function updateGoogleContact(
  refreshToken: string,
  resourceName: string,
  input: ContactInput
): Promise<{ notFound: boolean; error: string | null }> {
  let accessToken: string;
  try {
    accessToken = await getAccessTokenFromRefreshToken(refreshToken);
  } catch (err) {
    return { notFound: false, error: err instanceof Error ? err.message : "Gagal ambil access token" };
  }

  const getRes = await fetch(`${PEOPLE_API_BASE}/${resourceName}?personFields=names`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (getRes.status === 404) return { notFound: true, error: null };
  if (!getRes.ok) return { notFound: false, error: `Google People API error: ${await getRes.text()}` };
  const existing = await getRes.json();

  const res = await fetch(
    `${PEOPLE_API_BASE}/${resourceName}:updateContact?updatePersonFields=names,phoneNumbers,emailAddresses`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        etag: existing.etag,
        names: [{ givenName: input.name }],
        phoneNumbers: [{ value: input.phone, type: "mobile" }],
        emailAddresses: input.email ? [{ value: input.email }] : [],
      }),
    }
  );
  if (!res.ok) return { notFound: false, error: `Google People API error: ${await res.text()}` };
  return { notFound: false, error: null };
}
