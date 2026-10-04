"use client";

// src/components/property/KprSimulator.tsx

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateNonSubsidi,
  calculateSubsidi,
  formatRupiahShort,
  NON_SUBSIDI_MIN_DP_RATIO,
  SUBSIDI_MIN_DP_RATIO,
  type KprScenario,
} from "@/lib/kpr/calculator";

interface KprSimulatorProps {
  price: number;
  subsidi: boolean;
}

function ScenarioTable({ title, note, scenario }: { title: string; note: string; scenario: KprScenario }) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </div>
      <div className="text-xs text-muted-foreground">Plafon kredit: {formatRupiahShort(scenario.principal)}</div>
      {scenario.dpTooLow && (
        <div className="text-xs text-destructive">DP di bawah minimal ({formatRupiahShort(scenario.minDp)}).</div>
      )}
      <div className="grid grid-cols-3 gap-2 text-center">
        {scenario.installments.map((i) => (
          <div key={i.tenorYears} className="rounded-md bg-muted/50 px-2 py-2">
            <div className="text-xs text-muted-foreground">{i.tenorYears} tahun</div>
            <div className="text-sm font-semibold">{formatRupiahShort(i.monthly)}</div>
            <div className="text-[10px] text-muted-foreground">per bulan</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simulasi angsuran KPR per listing (perhitungan di src/lib/kpr/calculator.ts -- sama dengan yang dipakai AI Agent). */
export function KprSimulator({ price, subsidi }: KprSimulatorProps) {
  const defaultDp = Math.round(price * (subsidi ? SUBSIDI_MIN_DP_RATIO : NON_SUBSIDI_MIN_DP_RATIO));
  const [dpInput, setDpInput] = useState(String(defaultDp));

  const dp = Number(dpInput.replace(/[^\d]/g, "")) || 0;
  const valid = dp > 0 && dp < price;

  return (
    <div className="space-y-4">
      <div className="max-w-xs space-y-2">
        <Label htmlFor="kpr-dp">DP yang dibayar konsumen (Rp)</Label>
        <Input
          id="kpr-dp"
          inputMode="numeric"
          value={dp ? dp.toLocaleString("id-ID") : ""}
          onChange={(e) => setDpInput(e.target.value)}
          placeholder="mis. 5.000.000"
        />
        <div className="text-xs text-muted-foreground">Harga listing: {formatRupiahShort(price)}</div>
      </div>

      {valid ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {subsidi && (
            <ScenarioTable
              title="KPR Subsidi"
              note="Bunga tetap sepanjang tenor (acuan tabel bank)."
              scenario={calculateSubsidi(price, dp)}
            />
          )}
          <ScenarioTable
            title="KPR Non-Subsidi"
            note="Asumsi bunga 7% tetap 3 tahun pertama, setelah itu mengambang (tidak dihitung)."
            scenario={calculateNonSubsidi(price, dp)}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Isi DP yang lebih kecil dari harga listing untuk melihat simulasi.</p>
      )}

      <p className="text-xs text-muted-foreground">
        Ini hanya simulasi. Angka pasti ditentukan oleh pihak bank saat pengajuan KPR disetujui, dan bisa berbeda
        antar bank.
      </p>
    </div>
  );
}
