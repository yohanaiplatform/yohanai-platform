// src/lib/i18n/constants.ts
//
// Dipisah dari getLocale.ts supaya client component (LanguageToggle.tsx)
// bisa import konstanta ini tanpa ikut menarik "next/headers" ke bundle
// client -- getLocale.ts server-only, file ini aman dipakai di mana saja.

export const LOCALE_COOKIE = "yohanai_locale";
