"use client";

// src/components/admin/RunAnalysisButton.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Memicu analisis berkala sekarang (tes email / data terbaru). Hanya terlihat di Master Admin. */
export function RunAnalysisButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/analysis/run", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { error?: string; narrative?: boolean; emailed?: boolean };
      if (!res.ok) {
        setMessage(json.error ?? "Gagal membuat analisis.");
        return;
      }
      setMessage(
        `Analisis dibuat. Ringkasan AI: ${json.narrative ? "ada" : "tidak tersedia"}. Email ke pemilik: ${json.emailed ? "terkirim" : "tidak terkirim (cek RESEND/penerima)"}.`
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={run}>
        {busy ? "Membuat analisis..." : "Buat analisis sekarang"}
      </Button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  );
}
