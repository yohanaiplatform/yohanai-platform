"use client";

// src/components/property/PpjbEditor.tsx
//
// Formulir + pratinjau PPJB. Pola sama dengan MoU/Kwitansi (simpan ke riwayat, lalu cetak/Simpan PDF). Klausul kesepakatan
// bisa diubah penuh: edit teks, tambah dari klausul standar, hapus, urutkan; token {{booking}} {{sisa}} {{total_dp}} {{harga}}
// {{penerima}} {{fasilitas}} diganti otomatis dari isian formulir. Memakai class "mou-doc" (pembungkus cetak dokumen generik).

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Printer, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { DocChoiceField, DocTextField } from "@/components/property/documentFields";
import { PpjbDocument } from "@/components/property/PpjbDocument";
import { computeBookingBalance, PURCHASE_METHODS, type PurchaseMethod } from "@/lib/documents/kwitansiTypes";
import { rupiah } from "@/lib/documents/mouTypes";
import { defaultClauses, renderClause, STANDARD_CLAUSES, type PpjbForm, type PpjbPerson } from "@/lib/documents/ppjbTypes";

interface PpjbEditorProps {
  listingId: string;
  slug: string;
  initialForm: PpjbForm;
  listing: { title: string };
  initialNumber: string;
  history: { id: string; createdAt: string; docNumber: string | null }[];
  logoUrl?: string | null;
}

const CLAUSE_LABELS: Record<string, string> = {
  booking: "Uang tanda jadi / booking",
  sisaDp: "Sisa uang muka (KPR / bertahap)",
  sisaCash: "Sisa pembayaran (cash)",
  fasilitas: "Fasilitas ekstra developer",
  blokir: "Selisih biaya blokir angsuran",
  plafond: "Plafond kredit di bawah pengajuan",
  berkas: "Kelengkapan berkas KPR (14 hari)",
  flpp: "FLPP ditolak -> KPR Non-Subsidi",
  kprDitolak: "KPR tidak disetujui bank",
  batal: "Pembatalan saat proses KPR / Notaris",
  batalCash: "Pembatalan jual beli (uang tanda jadi hangus)",
  bangunan: "Pembangunan tambahan oleh developer",
};

function PersonFields({ title, person, onChange, extra }: { title: string; person: PpjbPerson; onChange: (p: PpjbPerson) => void; extra?: React.ReactNode }) {
  const set = <K extends keyof PpjbPerson>(key: K, value: string) => onChange({ ...person, [key]: value });
  return (
    <SectionCard title={title} description="Identitas untuk bagian pembuka perjanjian.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DocTextField label="Nama" value={person.name} onChange={(v) => set("name", v)} />
        <DocTextField label="No. HP" value={person.phone} onChange={(v) => set("phone", v)} />
        <DocTextField label="Tempat lahir" value={person.birthPlace} onChange={(v) => set("birthPlace", v)} placeholder="Pontianak" />
        <DocTextField label="Tanggal lahir" type="date" value={person.birthDate} onChange={(v) => set("birthDate", v)} />
        <DocTextField label="Alamat" value={person.address} onChange={(v) => set("address", v)} wide />
        <DocTextField label="No. KTP" value={person.idNumber} onChange={(v) => set("idNumber", v)} wide />
        {extra}
      </div>
    </SectionCard>
  );
}

export function PpjbEditor({ listingId, slug, initialForm, listing, initialNumber, history, logoUrl = null }: PpjbEditorProps) {
  const [form, setForm] = useState<PpjbForm>(initialForm);
  const [docNumber, setDocNumber] = useState(initialNumber);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [library, setLibrary] = useState("booking");

  const p = form.property;
  const balance = computeBookingBalance({ price: p.price, purchaseMethod: p.method, totalDp: p.totalDp }, p.booking);

  function setProperty<K extends keyof PpjbForm["property"]>(key: K, value: PpjbForm["property"][K]) {
    setForm((f) => ({ ...f, property: { ...f.property, [key]: value } }));
  }
  function setParty2<K extends keyof PpjbForm["party2"]>(key: K, value: string) {
    setForm((f) => ({ ...f, party2: { ...f.party2, [key]: value } }));
  }
  function changeMethod(method: PurchaseMethod) {
    setForm((f) => ({
      ...f,
      property: { ...f.property, method },
      // Klausul ikut metode, kecuali pengguna sudah mengubah daftarnya sendiri.
      clauses: f.clausesEdited ? f.clauses : defaultClauses(method),
    }));
  }
  function setClauses(next: string[]) {
    setForm((f) => ({ ...f, clauses: next, clausesEdited: true }));
  }
  function moveClause(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= form.clauses.length) return;
    const next = [...form.clauses];
    [next[i], next[j]] = [next[j], next[i]];
    setClauses(next);
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/properties/documents/ppjb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, form, listing, docNumber }),
      });
      const json = (await res.json().catch(() => ({}))) as { docNumber?: string; error?: string };
      if (!res.ok) {
        setMessage({ text: json.error ?? "Gagal menyimpan PPJB.", ok: false });
        return false;
      }
      if (json.docNumber) setDocNumber(json.docNumber);
      setMessage({ text: `Tersimpan di riwayat dokumen (No. ${json.docNumber}).`, ok: true });
      return true;
    } catch {
      setMessage({ text: "Gagal menyimpan PPJB. Coba lagi.", ok: false });
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

  const footer = `PPJB ${docNumber || ""}`.trim().replace(/"/g, "");

  return (
    <div className="mou-doc space-y-6">
      <style>{`@page { size: A4; margin: 12mm 15mm 16mm 15mm; @bottom-left { content: "${footer}"; font-size: 8pt; color: #6b7280; } @bottom-right { content: "Halaman " counter(page) " dari " counter(pages); font-size: 8pt; color: #6b7280; } }`}</style>

      <div className="no-print space-y-6">
        <PersonFields title="Pembeli" person={form.buyer} onChange={(b) => setForm((f) => ({ ...f, buyer: b }))} />

        <PersonFields
          title="Penjual -- pemilik / developer"
          person={form.seller}
          onChange={(s) => setForm((f) => ({ ...f, seller: { ...f.seller, ...s } }))}
          extra={
            <DocTextField
              label="Mewakili perusahaan developer (kosongkan kalau penjual perorangan)"
              value={form.seller.company}
              onChange={(v) => setForm((f) => ({ ...f, seller: { ...f.seller, company: v } }))}
              wide
            />
          }
        />

        <SectionCard title="Properti dan pembayaran" description="Diambil dari data listing; lengkapi nomor unit dan angka pembayaran.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DocTextField label="Jenis properti" value={p.kind} onChange={(v) => setProperty("kind", v)} placeholder="Rumah Tinggal" />
            <DocTextField label="Tipe" value={p.type} onChange={(v) => setProperty("type", v)} placeholder="Type 36" />
            <DocTextField label="Kompleks / proyek" value={p.complexName} onChange={(v) => setProperty("complexName", v)} placeholder="Kompleks Kapur Mas Residence" />
            <DocTextField label="No. unit" value={p.unitNo} onChange={(v) => setProperty("unitNo", v)} placeholder="I-23" />
            <DocTextField label="Alamat" value={p.address} onChange={(v) => setProperty("address", v)} wide />
            <DocTextField label="SHM Nomor" value={p.shmNumber} onChange={(v) => setProperty("shmNumber", v)} />
            <DocTextField label="Harga unit (angka, Rp)" value={p.price} onChange={(v) => setProperty("price", v)} />
            <DocChoiceField label="Metode pembayaran" value={p.method} options={PURCHASE_METHODS} onChange={(v) => changeMethod(v as PurchaseMethod)} />
            {balance.usesDp ? (
              <DocTextField label="Total DP (angka, Rp)" value={p.totalDp} onChange={(v) => setProperty("totalDp", v)} placeholder="4500000" />
            ) : (
              <p className="text-xs text-muted-foreground sm:col-span-1">Cash: sisa pembayaran dihitung dari harga unit dikurangi booking.</p>
            )}
            <div className="space-y-1">
              <DocTextField label="Booking unit / DP awal (angka, Rp)" value={p.booking} onChange={(v) => setProperty("booking", v)} placeholder="2000000" />
              {balance.remaining !== null ? (
                <p className={`text-xs ${balance.overpaid ? "text-destructive" : "text-muted-foreground"}`}>Sisa: {rupiah(balance.remaining)}</p>
              ) : (
                <p className="text-xs text-amber-600">{balance.usesDp ? "Isi Total DP" : "Isi harga unit"} agar sisa terhitung.</p>
              )}
            </div>
            <DocTextField label="Booking dibayarkan ke rekening / cara" value={p.paymentReceiver} onChange={(v) => setProperty("paymentReceiver", v)} placeholder="PT. ... / Tunai" wide />
            <DocTextField label="Fasilitas ekstra dari developer" value={p.facilities} onChange={(v) => setProperty("facilities", v)} placeholder="Gratis BPHTB, Gratis Biaya Pemasangan PDAM, ..." wide />
          </div>
        </SectionCard>

        <SectionCard title="Ketentuan kesepakatan (klausul)" description="Bisa diubah penuh. Token di dalam kurung kurawal dua diganti otomatis dari isian di atas.">
          <p className="mb-3 text-xs text-muted-foreground">
            Token: <code>{"{{booking}}"}</code> <code>{"{{sisa}}"}</code> <code>{"{{total_dp}}"}</code> <code>{"{{harga}}"}</code> <code>{"{{penerima}}"}</code> <code>{"{{fasilitas}}"}</code>
          </p>
          <ol className="space-y-3">
            {form.clauses.map((c, i) => (
              <li key={i} className="rounded-lg border border-border p-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold">Klausul {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => moveClause(i, -1)} aria-label="Naikkan">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === form.clauses.length - 1} onClick={() => moveClause(i, 1)} aria-label="Turunkan">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setClauses(form.clauses.filter((_, k) => k !== i))} aria-label="Hapus">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <textarea
                  value={c}
                  onChange={(e) => setClauses(form.clauses.map((x, k) => (k === i ? e.target.value : x)))}
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">Hasil: {renderClause(c, form)}</p>
              </li>
            ))}
          </ol>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Tambah dari klausul standar</Label>
              <select
                value={library}
                onChange={(e) => setLibrary(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
              >
                {Object.keys(STANDARD_CLAUSES).map((k) => (
                  <option key={k} value={k}>
                    {CLAUSE_LABELS[k] ?? k}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setClauses([...form.clauses, STANDARD_CLAUSES[library]])}>
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setClauses([...form.clauses, ""])}>
              <Plus className="h-4 w-4" />
              Klausul kosong
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => setForm((f) => ({ ...f, clauses: defaultClauses(f.property.method), clausesEdited: false }))}
            >
              <RotateCcw className="h-4 w-4" />
              Kembalikan standar {p.method}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Penandatanganan dan nomor" description="Nomor PPJB: kode proyek / bulan romawi / tahun / urutan.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DocTextField label="Kota penandatanganan" value={form.signPlace} onChange={(v) => setForm((f) => ({ ...f, signPlace: v }))} placeholder="Pontianak" />
            <DocTextField label="Tanggal penandatanganan" type="date" value={form.signDate} onChange={(v) => setForm((f) => ({ ...f, signDate: v }))} />
            <DocTextField label="Kode proyek untuk nomor otomatis (huruf/angka)" value={form.docNumberProject} onChange={(v) => setForm((f) => ({ ...f, docNumberProject: v.replace(/[^A-Za-z0-9]/g, "").toUpperCase() }))} placeholder="KPRMAS" />
            <DocTextField label="Nomor PPJB (kosongkan = otomatis)" value={docNumber} onChange={(v) => setDocNumber(v.toUpperCase())} placeholder="PPJB/KPRMAS/IX/2026/0030" />
            <DocTextField label="Catatan kaki (opsional)" value={form.footnote} onChange={(v) => setForm((f) => ({ ...f, footnote: v }))} placeholder="(*) Coret yang tidak perlu" wide />
          </div>
        </SectionCard>

        <SectionCard title="Saksi -- agen dan perusahaan" description="Isian tetap yang sama dengan MoU dan Kwitansi; tersimpan untuk dokumen berikutnya di akun Anda.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DocTextField label="Nama agen (marketing)" value={form.party2.agentName} onChange={(v) => setParty2("agentName", v)} />
            <DocTextField label="Kantor agen properti" value={form.party2.officeName} onChange={(v) => setParty2("officeName", v)} />
            <DocTextField label="Perusahaan" value={form.party2.companyName} onChange={(v) => setParty2("companyName", v)} />
            <DocTextField label="Alamat kantor" value={form.party2.officeAddress} onChange={(v) => setParty2("officeAddress", v)} />
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
          Di jendela cetak pilih tujuan &quot;Simpan sebagai PDF&quot;, ukuran A4, dan matikan &quot;Header dan footer&quot; browser. Identitas pembeli tersimpan di riwayat dokumen listing ini
          (hanya admin dan agen listing yang bisa melihat).
        </p>

        {history.length > 0 && (
          <SectionCard title="Riwayat PPJB" description="PPJB yang pernah dibuat untuk listing ini. Klik untuk memuat ulang isinya.">
            <ul className="space-y-1 text-sm">
              {history.map((h) => (
                <li key={h.id}>
                  <Link href={`/properties/${slug}/documents/ppjb?doc=${h.id}`} className="text-brand hover:underline">
                    {h.docNumber ?? "PPJB"} -- {h.createdAt}
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      <div>
        <p className="no-print mb-2 text-sm font-semibold">Pratinjau PPJB</p>
        <div className="print-area mx-auto max-w-[210mm] rounded border border-border bg-white p-8 shadow-sm">
          <PpjbDocument form={form} docNumber={docNumber} logoUrl={logoUrl} />
        </div>
      </div>
    </div>
  );
}
