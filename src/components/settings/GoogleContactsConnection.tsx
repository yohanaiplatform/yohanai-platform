"use client";

// src/components/settings/GoogleContactsConnection.tsx

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Personal per user (29 September 2026) -- tiap user sambungkan akun
 * Google pribadinya sendiri. Begitu tersambung, lead yang mereka input
 * manual (/crm/new) otomatis jadi kontak di Google Contacts & HP mereka
 * sendiri (lewat POST /api/leads/[id]/sync-contact).
 */
export function GoogleContactsConnection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  // Lazy initializer (bukan effect+setState) -- baca query param sekali
  // saat mount, supaya notice tetap kelihatan setelah URL dibersihkan
  // lewat router.replace() di bawah, tanpa kena lint set-state-in-effect.
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(() => {
    const status = searchParams.get("google_contacts");
    if (status === "connected") return { type: "success", message: "Google Contacts berhasil tersambung." };
    if (status === "error") {
      return {
        type: "error",
        message: searchParams.get("google_contacts_message") ?? "Gagal menyambungkan Google Contacts.",
      };
    }
    return null;
  });

  useEffect(() => {
    let active = true;

    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .schema("auth_ext")
        .from("google_contacts_connections")
        .select("google_email")
        .maybeSingle();

      if (!active) return;
      setGoogleEmail(data?.google_email ?? null);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Cuma navigasi (bersihkan query param dari URL) -- bukan setState di
    // komponen ini, jadi tidak kena react-hooks/set-state-in-effect.
    if (searchParams.get("google_contacts")) {
      router.replace("/settings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await fetch("/api/google-contacts/disconnect", { method: "POST" });
    setDisconnecting(false);

    if (res.ok) {
      setGoogleEmail(null);
      setNotice({ type: "success", message: "Sambungan Google Contacts diputuskan." });
    } else {
      setNotice({ type: "error", message: "Gagal memutuskan sambungan. Coba lagi." });
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-medium text-sm">Google Contacts</h3>
        <p className="text-xs text-muted-foreground">
          Sambungkan akun Google pribadi Anda -- lead yang Anda input manual di CRM otomatis jadi kontak di
          Google Contacts &amp; HP Anda sendiri.
        </p>
      </div>

      {notice && (
        <p className={`text-xs ${notice.type === "success" ? "text-green-600" : "text-destructive"}`}>
          {notice.message}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : googleEmail ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm">
            Terhubung sebagai <strong>{googleEmail}</strong>
          </span>
          <Button type="button" size="sm" variant="outline" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? "Memutuskan..." : "Putuskan Sambungan"}
          </Button>
        </div>
      ) : (
        <a href="/api/google-contacts/authorize" className={cn(buttonVariants({ size: "sm" }))}>
          Sambungkan Google Contacts
        </a>
      )}
    </div>
  );
}
