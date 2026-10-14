"use client";

// src/components/property/MouDocumentEditor.tsx
//
// Formulir + pratinjau MoU Pemasaran. Diisi otomatis dari data listing; pengguna melengkapi yang kurang (identitas pemilik,
// sertifikat, komisi, dll), menyimpan (masuk riwayat dokumen), lalu cetak/Simpan PDF lewat dialog cetak browser.

import { useState } from "react";
import Link from "next/link";
import { Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LogoPosition } from "@/lib/branding/branding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { MouDocument } from "@/components/property/MouDocument";
import { formatBirthInfo, parseBirthInfo, type MouForm, type MouListingInfo } from "@/lib/documents/mouTypes";

interface MouDocumentEditorProps {
  listingId: string;
  slug: string;
  initialForm: MouForm;
  listing: MouListingInfo;
  initialCode: string;
  history: { id: string; createdAt: string; docNumber: string | null }[];
  logoUrl?: string | null;
  logoPosition?: LogoPosition | null;
}

/** Kecilkan foto KTP di browser (maks 1100px, JPEG) supaya ringan disimpan dan dicetak. */
async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MouDocumentEditor({ listingId, slug, initialForm, listing, initialCode, history, logoUrl = null, logoPosition = null }: MouDocumentEditorProps) {
  const [form, setForm] = useState<MouForm>(initialForm);
  const [code, setCode] = useState(initialCode);
  const [birth, setBirth] = useState(() => parseBirthInfo(initialForm.owner.birthInfo));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function setOwner<K extends keyof MouForm["owner"]>(key: K, value: string) {
    setForm((f) => ({ ...f, owner: { ...f.owner, [key]: value } }));
  }
  function setBirthPart(next: { place: string; dateIso: string }) {
    setBirth(next);
    setOwner("birthInfo", formatBirthInfo(next.place, next.dateIso));
  }
  function setParty2<K extends keyof MouForm["party2"]>(key: K, value: string) {
    setForm((f) => ({ ...f, party2: { ...f.party2, [key]: value } }));
  }
  function setProperty<K extends keyof MouForm["property"]>(key: K, value: string) {
    setForm((f) => ({ ...f, property: { ...f.property, [key]: value } }));
  }
  function setAgreement<K extends keyof MouForm["agreement"]>(key: K, value: string) {
    setForm((f) => ({ ...f, agreement: { ...f.agreement, [key]: value } }));
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/properties/documents/mou", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, form, listing, listingCode: code }),
      });
      const json = (await res.json().catch(() => ({}))) as { listingCode?: string; error?: string };
      if (!res.ok) {
        setMessage({ text: json.error ?? "Gagal menyimpan dokumen.", ok: false });
        return false;
      }
      if (json.listingCode) setCode(json.listingCode);
      setMessage({ text: `Tersimpan di riwayat dokumen (Listing ID ${json.listingCode}).`, ok: true });
      return true;
    } catch {
      setMessage({ text: "Gagal menyimpan dokumen. Coba lagi.", ok: false });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndPrint() {
    const ok = await save();
    if (!ok) return;
    // beri waktu React memperbarui Listing ID di pratinjau sebelum dialog cetak dibuka
    setTimeout(() => window.print(), 300);
  }

  const footer = `Perjanjian Pemasaran ${code || ""}`.trim().replace(/"/g, "");

  return (
    <div className="mou-doc space-y-6">
      <style>{`@page { size: A4; margin: 12mm 15mm 16mm 15mm; @bottom-left { content: "${footer}"; font-size: 8pt; color: #6b7280; } @bottom-right { content: "Halaman " counter(page) " dari " counter(pages); font-size: 8pt; color: #6b7280; } }`}</style>

      <div className="no-print space-y-6">
        <SectionCard title="Pihak 1 -- Pemilik" description="Identitas pemilik disimpan terpisah dan hanya bisa dilihat admin dan agen yang menangani listing ini.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Nama" value={form.owner.name} onChange={(v) => setOwner("name", v)} />
            <TextField label="No. telepon" value={form.owner.phone} onChange={(v) => setOwner("phone", v)} />
            <TextField label="Tempat lahir Pihak 1" value={birth.place} onChange={(v) => setBirthPart({ ...birth, place: v })} placeholder="Pontianak" />
            <div className="space-y-1">
              <Label className="text-xs">Tanggal lahir Pihak 1</Label>
              <Input type="date" value={birth.dateIso} onChange={(e) => setBirthPart({ ...birth, dateIso: e.target.value })} />
            </div>
            <TextField label="Pekerjaan" value={form.owner.occupation} onChange={(v) => setOwner("occupation", v)} />
            <TextField label="Alamat" value={form.owner.address} onChange={(v) => setOwner("address", v)} wide />
            <TextField label="No. KTP / SIM" value={form.owner.idNumber} onChange={(v) => setOwner("idNumber", v)} wide />
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Foto KTP (tampil di halaman Dokumen Pendukung)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("mou-ktp-file")?.click()}>
                  {form.owner.idPhoto ? "Ganti foto KTP" : "Unggah foto KTP"}
                </Button>
                {form.owner.idPhoto && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOwner("idPhoto", "")}>
                    Hapus
                  </Button>
                )}
                <input
                  id="mou-ktp-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    try {
                      setOwner("idPhoto", await shrinkImage(file));
                    } catch {
                      setMessage({ text: "Gagal membaca gambar KTP. Coba file lain.", ok: false });
                    }
                  }}
                />
                {form.owner.idPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.owner.idPhoto} alt="Pratinjau KTP" className="h-16 w-auto rounded border border-border" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Foto dilindungi akses (hanya admin dan agen listing ini) dan dikecilkan otomatis.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Properti dan komisi" description="Diambil dari data listing; sesuaikan bila perlu.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Nama / jenis properti" value={form.property.type} onChange={(v) => setProperty("type", v)} />
            <TextField label="Jumlah unit" value={form.property.units} onChange={(v) => setProperty("units", v)} />
            <ChoiceField label="Penawaran" value={form.property.offer} options={["Dijual", "Disewakan"]} onChange={(v) => setProperty("offer", v)} />
            <TextField label="Harga penawaran (angka, Rp)" value={form.property.price} onChange={(v) => setProperty("price", v)} />
            <TextField label="Lokasi" value={form.property.location} onChange={(v) => setProperty("location", v)} wide />
            <TextField label="Jenis sertifikat" value={form.property.certificate} onChange={(v) => setProperty("certificate", v)} placeholder="Sertifikat Hak Milik (SHM)" />
            <TextField label="Nomor sertifikat" value={form.property.certificateNumber} onChange={(v) => setProperty("certificateNumber", v)} />
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Deskripsi properti (diisi manual)</Label>
              <textarea
                value={form.property.description}
                onChange={(e) => setProperty("description", e.target.value)}
                rows={3}
                placeholder="mis. Rumah type 45, sudah renovasi dan siap huni"
                className="w-full rounded-md border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring"
              />
            </div>
            <TextField label="Komisi (%)" value={form.property.commissionPct} onChange={(v) => setProperty("commissionPct", v)} placeholder="3" />
            <TextField label="Atau komisi nominal (Rp)" value={form.property.commissionNominal} onChange={(v) => setProperty("commissionNominal", v)} />
            <TextField label="Closing fee (Rp)" value={form.property.closingFee} onChange={(v) => setProperty("closingFee", v)} />
          </div>
        </SectionCard>

        <SectionCard title="Perjanjian" description="Jenis, masa berlaku, tempat dan tanggal tanda tangan.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Listing ID (nomor dokumen)</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={`Kosongkan = otomatis, mis. ${form.party2.listingPrefix || "GDI"}/${new Date().getFullYear()}/12`} />
              <p className="text-xs text-muted-foreground">
                Format: AWALAN/TAHUN/NOMOR, mis. GDI/2026/12. Tercetak di setiap halaman dan menjadi nomor listing ini. Kosongkan untuk dibuat otomatis berurutan.
              </p>
            </div>
            <ChoiceField label="Jenis perjanjian" value={form.agreement.kind} options={["NON-EKSKLUSIF", "EKSKLUSIF"]} onChange={(v) => setAgreement("kind", v)} />
            <TextField label="Masa perjanjian (bulan)" value={form.agreement.months} onChange={(v) => setAgreement("months", v)} />
            <TextField label="Kota penandatanganan MoU" value={form.agreement.signPlace} onChange={(v) => setAgreement("signPlace", v)} placeholder="Pontianak" />
            <div className="space-y-1">
              <Label className="text-xs">Tanggal penandatanganan MoU (bukan tanggal lahir)</Label>
              <Input type="date" value={form.agreement.signDate} onChange={(e) => setAgreement("signDate", e.target.value)} />
            </div>
            <ChoiceField label="Pemasangan spanduk" value={form.agreement.banner} options={["YA", "TIDAK"]} onChange={(v) => setAgreement("banner", v)} />
            <TextField label="Dokumen diserahkan" value={form.agreement.documents} onChange={(v) => setAgreement("documents", v)} placeholder="KTP, Copy Sertifikat" />
            <TextField label="Info tambahan" value={form.agreement.extraInfo} onChange={(v) => setAgreement("extraInfo", v)} wide />
          </div>
        </SectionCard>

        <SectionCard title="Pihak 2 -- Agen dan perusahaan" description="Disimpan sebagai isian tetap untuk dokumen berikutnya (hanya untuk akun Anda).">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Nama agen" value={form.party2.agentName} onChange={(v) => setParty2("agentName", v)} />
            <TextField label="Kantor agen properti" value={form.party2.officeName} onChange={(v) => setParty2("officeName", v)} />
            <TextField label="Perusahaan" value={form.party2.companyName} onChange={(v) => setParty2("companyName", v)} />
            <TextField label="Pimpinan / principal" value={form.party2.principalName} onChange={(v) => setParty2("principalName", v)} />
            <TextField label="Alamat kantor" value={form.party2.officeAddress} onChange={(v) => setParty2("officeAddress", v)} wide />
            <TextField label="Nama bank" value={form.party2.bankName} onChange={(v) => setParty2("bankName", v)} />
            <TextField label="Nomor rekening" value={form.party2.accountNumber} onChange={(v) => setParty2("accountNumber", v)} />
            <TextField label="Atas nama rekening" value={form.party2.accountName} onChange={(v) => setParty2("accountName", v)} />
            <TextField label="Email kantor" value={form.party2.officeEmail} onChange={(v) => setParty2("officeEmail", v)} />
            <TextField label="Service area" value={form.party2.serviceArea} onChange={(v) => setParty2("serviceArea", v)} />
            <TextField label="Awalan nomor otomatis (huruf saja)" value={form.party2.listingPrefix} onChange={(v) => setParty2("listingPrefix", v.replace(/[^A-Za-z]/g, "").toUpperCase())} placeholder="GDI" />
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
          Di jendela cetak pilih tujuan &quot;Simpan sebagai PDF&quot;, ukuran A4, dan matikan &quot;Header dan footer&quot; browser (nomor halaman sudah dicetak otomatis).
        </p>

        {history.length > 0 && (
          <SectionCard title="Riwayat dokumen" description="MoU yang pernah dibuat untuk listing ini. Klik untuk memuat ulang isinya.">
            <ul className="space-y-1 text-sm">
              {history.map((h) => (
                <li key={h.id}>
                  <Link href={`/properties/${slug}/documents/mou?doc=${h.id}`} className="text-brand hover:underline">
                    {h.docNumber ?? "MoU"} -- {h.createdAt}
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      <div>
        <p className="no-print mb-2 text-sm font-semibold">Pratinjau dokumen</p>
        <div className="print-area mx-auto max-w-[210mm] rounded border border-border bg-white p-8 shadow-sm">
          <MouDocument form={form} listing={listing} code={code} logoUrl={logoUrl} logoPosition={logoPosition} />
        </div>
      </div>
    </div>
  );
}
