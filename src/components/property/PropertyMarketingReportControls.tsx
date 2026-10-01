"use client";

// src/components/property/PropertyMarketingReportControls.tsx

import { useState } from "react";
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

function NotesEditor({ label, placeholder, value, onChange }: NotesEditorProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-md border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 print:resize-none print:border-none print:p-0"
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
