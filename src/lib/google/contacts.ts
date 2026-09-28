// src/lib/google/contacts.ts

/**
 * Google People API client (server-only). Dipakai buat auto-create kontak
 * di Google Contacts akun yohan.ai.platform@gmail.com tiap ada lead baru
 * masuk (Task item 6, 28 September 2026).
 *
 * OAuth2 refresh-token flow -- BUKAN service account, karena
 * yohan.ai.platform@gmail.com akun Gmail biasa (bukan Google Workspace),
 * jadi tidak bisa pakai domain-wide delegation. Refresh token didapat sekali
 * lewat alur di /api/google-contacts/authorize + /callback (lihat file itu),
 * lalu disimpan permanen sebagai env var GOOGLE_CONTACTS_REFRESH_TOKEN.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PEOPLE_API_BASE = "https://people.googleapis.com/v1";

export const CONTACTS_SCOPE = "https://www.googleapis.com/auth/contacts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum dikonfigurasi.`);
  return value;
}

/** Tukar refresh token dengan access token baru (access token berumur ~1 jam, selalu minta baru per panggilan -- volume rendah, tidak perlu cache). */
async function getAccessToken(): Promise<string> {
  const clientId = requireEnv("GOOGLE_CONTACTS_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CONTACTS_CLIENT_SECRET");
  const refreshToken = requireEnv("GOOGLE_CONTACTS_REFRESH_TOKEN");

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
 * Buat kontak baru di Google Contacts. Sengaja TIDAK cek duplikat dulu
 * (People API tidak punya pencarian-by-phone yang murah tanpa warmup index)
 * -- risiko dobel kontak rendah karena ini cuma dipanggil sekali per lead
 * baru (dedup lead-nya sendiri sudah terjadi di customer.leads).
 */
export async function createGoogleContact(input: ContactInput): Promise<{ resourceName: string | null; error: string | null }> {
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
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
