"use client";

// src/components/property/KwitansiEditor.tsx
//
// Formulir + pratinjau Kwitansi Booking Unit. Pola sama dengan MouDocumentEditor: simpan ke riwayat, lalu cetak/Simpan PDF.
// Memakai class "mou-doc" karena itu pembungkus cetak dokumen generik (aturan cetak di globals.css).

import { useState } from "react";
import Link from "next/link";
import { Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { DocChoiceField, DocTextField } from "@/components/property/documentFields";
import { KwitansiDocument } from "@/components/property/KwitansiDocument";
import type { KwitansiForm, KwitansiListingInfo } from "@/lib/documents/kwitansiTypes";
import { terbilangRupiah } from "@/lib/documents/terbilang";

interface KwitansiEditorProps {
  listingId: string;
  slug: string;
  initialForm: KwitansiForm;
  listing: KwitansiListingInfo;
  initialNumber: string;
  history: { id: string; createdAt: string; docNumber: string | null }[];
}

export function KwitansiEditor({ listingId, slug, initialForm, listing, initialNumber, history }: KwitansiEditorProps) {
  const [form, setForm] = useState<KwitansiForm>(initialForm);
  const [docNumber, setDocNumber] = useState(initialNumber);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function setBuyer<K extends keyof KwitansiForm["buyer"]>(key: K, value: string) {
    setForm((f) => ({ ...f, buyer: { ...f.buyer, [key]: value } }));
  }
  function setUnit<K extends keyof KwitansiForm["unit"]>(key: K, value: string) {
    setForm((f) => ({ ...f, unit: { ...f.unit, [key]: value } }));
  }
  function setPayment<K extends keyof KwitansiForm["payment"]>(key: K, value: string) {
    setForm((f) => ({ ...f, payment: { ...f.payment, [key]: value } }));
  }
  function setParty2<K extends keyof KwitansiForm["party2"]>(key: K, value: string) {
    setForm((f) => ({ ...f, party2: { ...f.party2, [key]: value } }));
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/properties/documents/kwitansi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, form, listing, docNumber }),
      });
      const json = (await res.json().catch(() => ({}))) as { docNumber?: string; error?: string };
      if (!res.ok) {
        setMessage({ text: json.error ?? "Gagal menyimpan kwitansi.", ok: false });
        return false;
      }
      if (json.docNumber) setDocNumber(json.docNumber);
      setMessage({ text: `Tersimpan di riwayat dokumen (No. ${json.docNumber}).`, ok: true });
      return true;
    } catch {
      setMessage({ text: "Gagal menyimpan kwitansi. Coba lagi.", ok: false });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndPrint() {
    const ok = await save();
    if (!ok) return;
    setTimeout(() => window.print(), 300);
  }

  const footer = `Kwitansi Booking ${docNumber || ""}`.trim().replace(/"/g, "");
  const words = terbilangRupiah(form.payment.amount);

  return (
    <div className="mou-doc space-y-6">
      <style>{`@page { size: A4; margin: 12mm 15mm 16mm 15mm; @bottom-left { content: "${footer}"; font-size: 8pt; color: #6b7280; } @bottom-right { content: "Halaman " counter(page) " dari " counter(pages); font-size: 8pt; color: #6b7280; } }`}</style>

      <div className="no-print space-y-6">
        <SectionCard title="Pembeli" description="Pihak yang membayar booking.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DocTextField label="Nama pembeli" value={form.buyer.name} onChange={(v) => setBuyer("name", v)} />
            <DocTextField label="No. telepon" value={form.buyer.phone} onChange={(v) => setBuyer("phone", v)} />
            <DocTextField label="Alamat" value={form.buyer.address} onChange={(v) => setBuyer("address", v)} wide />
          </div>
        </SectionCard>

        <SectionCard title="Unit dan pembayaran" description="Diambil dari data listing; lengkapi blok/nomor unit dan nominal booking.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DocTextField label="Proyek / properti" value={form.unit.projectName} onChange={(v) => setUnit("projectName", v)} wide />
            <DocTextField label="Blok / No. unit" value={form.unit.unitLabel} onChange={(v) => setUnit("unitLabel", v)} placeholder="Blok A No. 12" />
            <DocTextField label="Tipe" value={form.unit.type} onChange={(v) => setUnit("type", v)} placeholder="36/117" />
            <DocTextField label="Harga unit (angka, Rp) -- opsional" value={form.unit.price} onChange={(v) => setUnit("price", v)} />
            <div className="space-y-1">
              <DocTextField label="Nominal pembayaran (angka, Rp)" value={form.payment.amount} onChange={(v) => setPayment("amount", v)} placeholder="5000000" />
              {words && <p className="text-xs text-muted-foreground">Terbilang: {words}</p>}
            </div>
            <DocTextField label="Untuk pembayaran" value={form.payment.purpose} onChange={(v) => setPayment("purpose", v)} />
            <DocChoiceField label="Cara pembayaran" value={form.payment.method} options={["Transfer", "Tunai", "Lainnya"]} onChange={(v) => setPayment("method", v)} />
            <DocTextField label="Tanggal pembayaran" type="date" value={form.payment.date} onChange={(v) => setPayment("date", v)} />
            <DocTextField label="Kota penandatanganan" value={form.signPlace} onChange={(v) => setForm((f) => ({ ...f, signPlace: v }))} placeholder="Pontianak" />
            <DocTextField label="Nomor kwitansi (kosongkan = otomatis, mis. KW/GDI/2026/001)" value={docNumber} onChange={(v) => setDocNumber(v.toUpperCase())} />
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Catatan di kwitansi (opsional, ditulis manual)</Label>
              <textarea
                value={form.payment.notes}
                onChange={(e) => setPayment("notes", e.target.value)}
                rows={3}
                placeholder="mis. Pembayaran booking untuk pemesanan unit; ketentuan lanjutan mengikuti perjanjian yang ditandatangani."
                className="w-full rounded-md border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Penerima -- agen dan perusahaan" description="Isian tetap yang sama dengan MoU; tersimpan untuk dokumen berikutnya di akun Anda.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DocTextField label="Nama agen penerima" value={form.party2.agentName} onChange={(v) => setParty2("agentName", v)} />
            <DocTextField label="Kantor agen properti" value={form.party2.officeName} onChange={(v) => setParty2("officeName", v)} />
            <DocTextField label="Perusahaan" value={form.party2.companyName} onChange={(v) => setParty2("companyName", v)} />
            <DocTextField label="Alamat kantor" value={form.party2.officeAddress} onChange={(v) => setParty2("officeAddress", v)} />
            <DocTextField label="Nama bank" value={form.party2.bankName} onChange={(v) => setParty2("bankName", v)} />
            <DocTextField label="Nomor rekening" value={form.party2.accountNumber} onChange={(v) => setParty2("accountNumber", v)} />
            <DocTextField label="Atas nama rekening" value={form.party2.accountName} onChange={(v) => setParty2("accountName", v)} />
            <DocTextField
              label="Awalan nomor otomatis (huruf saja)"
              value={form.party2.listingPrefix}
              onChange={(v) => setParty2("listingPrefix", v.replace(/[^A-Za-z]/g, "").toUpperCase())}
              placeholder="GDI"
            />
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" className="gap-1.5" disabled={saving} onClick={save}>
            <Save className="h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button type="button" className="gap-1.5" disabled={saving} onClick={saveAndPrint}>
            <Printer className="h-4 w-4" />
            Simpan & Cetak / PDF
          </Button>
          <Link href={`/properties/${slug}`} className="text-sm text-muted-foreground hover:text-foreground">
            Kembali ke listing
          </Link>
          {message && <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-destructive"}`}>{message.text}</p>}
        </div>
        <p className="text-xs text-muted-foreground">
          Di jendela cetak pilih tujuan &quot;Simpan sebagai PDF&quot;, ukuran A4, dan matikan &quot;Header dan footer&quot; browser.
        </p>

        {history.length > 0 && (
          <SectionCard title="Riwayat kwitansi" description="Kwitansi yang pernah dibuat untuk listing ini. Klik untuk memuat ulang isinya.">
            <ul className="space-y-1 text-sm">
              {history.map((h) => (
                <li key={h.id}>
                  <Link href={`/properties/${slug}/documents/kwitansi?doc=${h.id}`} className="text-brand hover:underline">
                    {h.docNumber ?? "Kwitansi"} -- {h.createdAt}
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      <div>
        <p className="no-print mb-2 text-sm font-semibold">Pratinjau kwitansi</p>
        <div className="print-area mx-auto max-w-[210mm] rounded border border-border bg-white p-8 shadow-sm">
          <KwitansiDocument form={form} docNumber={docNumber} />
        </div>
      </div>
    </div>
  );
}
