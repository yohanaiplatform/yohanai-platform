"use client";

// src/components/layout/LanguageToggle.tsx

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LOCALE_COOKIE } from "@/lib/i18n/constants";
import type { Locale } from "@/lib/i18n/dictionaries";

interface LanguageToggleProps {
  initialLocale: Locale;
}

/**
 * Toggle ID/EN di header. Locale disimpan di cookie (bukan localStorage)
 * supaya halaman CRM (Server Component, render teks di server) ikut
 * berubah -- ganti bahasa memicu router.refresh() supaya server-render
 * ulang dengan cookie baru.
 *
 * initialLocale datang dari server (DashboardLayout -> AppShell -> Header)
 * supaya render awal cocok persis dengan cookie yang sudah ada -- sengaja
 * BUKAN baca document.cookie di useEffect (selain kena lint
 * react-hooks/set-state-in-effect, itu juga bikin kedipan UI balik ke "id"
 * sesaat sebelum efek jalan kalau locale tersimpan sebenarnya "en").
 *
 * Baru cakupan modul CRM (lihat docs/modules/crm.mdx); modul lain masih
 * bahasa Indonesia tetap.
 */
export function LanguageToggle({ initialLocale }: LanguageToggleProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function handleChange(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    setLocaleState(next);
    router.refresh();
  }

  return (
    <div className="flex items-center rounded-lg border border-input p-0.5 text-xs">
      <button
        type="button"
        onClick={() => handleChange("id")}
        aria-pressed={locale === "id"}
        className={cn(
          "rounded-md px-2 py-1 font-medium transition-colors",
          locale === "id"
            ? "bg-brand text-white"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => handleChange("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "rounded-md px-2 py-1 font-medium transition-colors",
          locale === "en"
            ? "bg-brand text-white"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  );
}
