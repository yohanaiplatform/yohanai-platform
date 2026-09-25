// src/lib/i18n/getLocale.ts

import { cookies } from "next/headers";
import { dictionaries, type Locale, type CrmDictionary } from "@/lib/i18n/dictionaries";
import { LOCALE_COOKIE } from "@/lib/i18n/constants";

/**
 * Locale disimpan di cookie (bukan localStorage) supaya Server Component
 * (halaman CRM, semuanya render teks di server) bisa ikut baca tanpa
 * kena mismatch hydration. LanguageToggle (client) yang menulis cookie
 * ini lalu router.refresh().
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "id";
}

export async function getCrmDictionary(): Promise<CrmDictionary> {
  const locale = await getLocale();
  return dictionaries[locale];
}
