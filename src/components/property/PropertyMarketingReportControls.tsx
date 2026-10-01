"use client";

// src/components/property/PropertyMarketingReportControls.tsx

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PropertyMarketingReportControlsProps {
  slug: string;
  dateFrom: string;
  dateTo: string;
}

/** Form filter tanggal + tombol cetak -- disembunyikan otomatis saat print lewat class "no-print" (lihat globals.css). */
export function PropertyMarketingReportDateForm({ slug, dateFrom, dateTo }: PropertyMarketingReportControlsProps) {
  const router = useRouter();
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/properties/${slug}/report?from=${from}&to=${to}`);
  }

  return (
    <form onSubmit={handleApply} className="no-print flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="report-from" className="text-xs">Dari Tanggal</Label>
        <Input id="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="report-to" className="text-xs">Sampai Tanggal</Label>
        <Input id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
      </div>
      <Button type="submit" size="sm" variant="outline">
        Terapkan
      </Button>
    </form>
  );
}

export function PropertyMarketingReportPrintButton() {
  return (
    <Button type="button" size="sm" className="no-print gap-1.5" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      Cetak / Simpan PDF
    </Button>
  );
}

interface NotesEditorProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Textarea biasa (rows tetap) bikin isi yang panjang disembunyikan di balik
 * scrollbar internal -- kelihatan normal di layar (masih bisa di-scroll),
 * tapi scrollbar itu ikut kebawa ke hasil cetak/PDF karena window.print()
 * cuma merender DOM apa adanya, bukan nge-scroll ke tiap bagian. Makanya
 * box harus tumbuh otomatis seukuran isinya -- kalau itu bikin laporan
 * jadi lebih dari 1 halaman A4, itu memang diterima (dikonfirmasi Yohan),
 * yang tidak boleh adalah teks yang terpotong/tersembunyi di balik scroll.
 */
function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return ref;
}

function NotesEditor({ label, placeholder, value, onChange }: NotesEditorProps) {
  const textareaRef = useAutoResizeTextarea(value);

  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none overflow-hidden rounded-md border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 print:border-none print:p-0"
      />
    </div>
  );
}

/** Catatan Agent + Rekomendasi -- teks bebas, diisi agen sebelum export, tidak disimpan ke database (sekali pakai per laporan, sama seperti form kertas lama). */
export function PropertyMarketingReportNotes() {
  const [catatan, setCatatan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");

  return (
    <div className="space-y-4">
      <NotesEditor
        label="Catatan Agent"
        placeholder="Catatan tambahan dari agent (opsional)..."
        value={catatan}
        onChange={setCatatan}
      />
      <NotesEditor
        label="Rekomendasi"
        placeholder="Rekomendasi untuk vendor/pemilik (opsional)..."
        value={rekomendasi}
        onChange={setRekomendasi}
      />
    </div>
  );
}
