"use client";

// src/components/settings/AiCreditForm.tsx

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AiCreditStatus } from "@/lib/reports/getAiCreditStatus";

const dateTime = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});
const usd = (n: number) => `$${n.toFixed(2)}`;

/**
 * Catat saldo kredit Claude Console (admin). Saldo asli tidak bisa dibaca otomatis, jadi angkanya dicatat manual dari
 * Console > Billing; Platform Report menaksir sisa saldo dan memperingatkan bila diperkirakan habis dalam 7 hari.
 */
export function AiCreditForm() {
  const [status, setStatus] = useState<AiCreditStatus | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-credit", { cache: "no-store" });
      if (res.ok) setStatus((await res.json()).status);
    } catch {
      // info saja
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ai-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balanceUsd: Number(value.replace(",", ".")) }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(data.error ?? "Gagal menyimpan.");
      else {
        setStatus(data.status);
        setValue("");
        setMessage("Saldo tersimpan.");
      }
    } catch {
      setMessage("Gagal menyimpan.");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {status && status.balanceUsd !== null ? (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          <div>
            Saldo tercatat: <strong>{usd(status.balanceUsd)}</strong>
            {status.recordedAt ? ` (${dateTime.format(new Date(status.recordedAt))} WIB)` : ""}
          </div>
          <div>
            Taksiran sisa sekarang: <strong>{usd(status.estimatedRemainingUsd ?? 0)}</strong>
            {status.daysLeft !== null ? ` -- sekitar ${Math.floor(status.daysLeft)} hari lagi` : ""} (pemakaian sejak dicatat:{" "}
            {usd(status.spentSinceUsd)}, rata-rata {usd(status.avgDailyUsd)}/hari)
          </div>
          {status.level === "critical" && <div className="mt-1 font-semibold text-destructive">Saldo hampir habis -- isi saldo atau aktifkan auto-reload di Claude Console.</div>}
          {status.level === "warn" && <div className="mt-1 font-semibold text-amber-700">Saldo diperkirakan habis dalam seminggu.</div>}
          {status.stale && <div className="mt-1 text-amber-700">Catatan sudah lebih dari 10 hari -- catat ulang saldo asli supaya taksirannya akurat.</div>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada saldo yang dicatat.</p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="ai-credit">Saldo kredit saat ini (USD)</Label>
          <Input id="ai-credit" inputMode="decimal" placeholder="mis. 3.63" value={value} onChange={(e) => setValue(e.target.value)} className="w-40" />
        </div>
        <Button type="button" size="sm" onClick={save} disabled={saving || !value.trim()}>
          {saving ? "Menyimpan..." : "Catat Saldo"}
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        Lihat angkanya di Claude Console, Billing (&quot;Organization credits&quot;). Catat ulang setiap kali Anda mengisi saldo atau
        sesekali untuk menyesuaikan taksiran. Peringatan masuk ke Platform Report harian.
      </p>
    </div>
  );
}
