"use client";

// src/components/admin/AdminReportPrint.tsx
//
// Versi cetak/PDF halaman Master Admin: pengaturan bagian yang dicetak + catatan laporan + tombol cetak, dan pembungkus
// bagian yang bisa disembunyikan saat cetak. Memakai window.print() browser (Simpan sebagai PDF) -- sama seperti Laporan
// Pemasaran; gaya cetak (A4, margin, nomor halaman, warna grafik) ada di globals.css (.admin-report).

import { createContext, useContext, useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type PrintSectionId = "ai" | "leads" | "system";

const SECTION_LABELS: Record<PrintSectionId, string> = {
  ai: "Biaya & pemakaian AI",
  leads: "Pertumbuhan lead",
  system: "Tren sistem",
};

interface PrintSettings {
  sections: Record<PrintSectionId, boolean>;
  setSection: (id: PrintSectionId, value: boolean) => void;
  note: string;
  setNote: (value: string) => void;
}

const PrintContext = createContext<PrintSettings | null>(null);

export function PrintSettingsProvider({ children }: { children: React.ReactNode }) {
  const [sections, setSections] = useState<Record<PrintSectionId, boolean>>({ ai: true, leads: true, system: true });
  const [note, setNote] = useState("");

  // Cetak selalu dengan tema terang (kertas putih), walau aplikasi sedang dark mode.
  useEffect(() => {
    let hadDark = false;
    const before = () => {
      hadDark = document.documentElement.classList.contains("dark");
      document.documentElement.classList.remove("dark");
    };
    const after = () => {
      if (hadDark) document.documentElement.classList.add("dark");
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  return (
    <PrintContext.Provider value={{ sections, setSection: (id, value) => setSections((s) => ({ ...s, [id]: value })), note, setNote }}>
      {children}
    </PrintContext.Provider>
  );
}

function usePrint(): PrintSettings {
  const ctx = useContext(PrintContext);
  if (!ctx) throw new Error("PrintSettingsProvider belum terpasang");
  return ctx;
}

/** Panel pengaturan cetak (tidak ikut tercetak): bagian yang disertakan + catatan + tombol cetak. */
export function PrintControls() {
  const { sections, setSection, note, setNote } = usePrint();

  return (
    <div className="no-print rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Pengaturan cetak</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {(Object.keys(SECTION_LABELS) as PrintSectionId[]).map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sections[id]} onChange={(e) => setSection(id, e.target.checked)} />
                {SECTION_LABELS[id]}
              </label>
            ))}
          </div>
        </div>
        <Button type="button" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Cetak / Simpan PDF
        </Button>
      </div>

      <div className="mt-3 space-y-1">
        <Label htmlFor="print-note" className="text-xs">
          Catatan laporan (opsional, ikut tercetak di bawah judul)
        </Label>
        <textarea
          id="print-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="mis. Evaluasi biaya AI minggu ke-2 Oktober"
          className="w-full rounded-md border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring"
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Di jendela cetak browser pilih tujuan &quot;Simpan sebagai PDF&quot;, ukuran A4, dan matikan opsi &quot;Header dan footer&quot; browser
        (nama platform dan nomor halaman sudah dicetak otomatis oleh laporan ini). Aktifkan &quot;Grafik latar belakang&quot; kalau grafik tampak pucat.
      </p>
    </div>
  );
}

/** Bagian laporan: tampil di layar, dan disembunyikan saat cetak kalau tidak dicentang di panel pengaturan. */
export function PrintSection({ id, children }: { id: PrintSectionId; children: React.ReactNode }) {
  const { sections } = usePrint();
  return <div className={sections[id] ? "" : "print:hidden"}>{children}</div>;
}

/** Catatan laporan: hanya tercetak (tampilan layar ada di panel pengaturan), tumbuh sesuai isi -- tanpa scrollbar. */
export function PrintNote() {
  const { note } = usePrint();
  if (!note.trim()) return null;
  return <p className="hidden whitespace-pre-wrap text-sm print:block print-avoid-break">{note.trim()}</p>;
}
