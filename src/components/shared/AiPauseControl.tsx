"use client";

// src/components/shared/AiPauseControl.tsx

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AI_PAUSE_HOURS } from "@/lib/ai/aiPause";

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

/**
 * Status AI per lead + tombol "Ambil alih" / "Kembalikan ke AI". Saat dijeda AI diam; jeda berakhir sendiri
 * setelah AI_PAUSE_HOURS jam sejak aktivitas manusia terakhir (balasan dari dashboard atau WhatsApp di HP/Web
 * memperpanjangnya). Memuat statusnya sendiri, jadi cukup dipasang dengan leadId.
 */
export function AiPauseControl({ leadId }: { leadId: string }) {
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/ai-pause`, { cache: "no-store" });
      if (res.ok) setPausedUntil((await res.json()).pausedUntil ?? null);
    } catch {
      // status hanya info; kegagalan baca tidak mengganggu halaman
    }
    setNow(Date.now());
    setLoaded(true);
  }, [leadId]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  async function act(action: "pause" | "resume") {
    setBusy(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/ai-pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) setPausedUntil((await res.json()).pausedUntil ?? null);
    } catch {
      // biarkan status lama; polling berikutnya menyegarkan
    }
    setNow(Date.now());
    setBusy(false);
  }

  if (!loaded) return null;

  const paused = pausedUntil !== null && new Date(pausedUntil).getTime() > now;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        paused ? "border-amber-300 bg-amber-50 text-amber-900" : "border-border bg-muted/40 text-muted-foreground"
      }`}
    >
      <span className="min-w-0 flex-1">
        {paused ? (
          <>
            <strong>AI dijeda</strong> sampai {timeFormat.format(new Date(pausedUntil))} WIB (Anda yang menangani). AI diam; jeda
            diperpanjang tiap Anda membalas.
          </>
        ) : (
          <>
            <strong>AI aktif</strong> membalas lead ini. Jeda otomatis {AI_PAUSE_HOURS} jam kalau Anda ikut membalas.
          </>
        )}
      </span>
      {paused ? (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => act("resume")}>
          Kembalikan ke AI
        </Button>
      ) : (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => act("pause")}>
          Ambil alih
        </Button>
      )}
    </div>
  );
}
