// src/components/property/KwitansiDocument.tsx
//
// Isi dokumen Kwitansi Booking Unit (presentasional): pratinjau di layar dan isi cetak. Logo perusahaan (Griya Indonesia),
// bukan logo Yohan.AI -- dokumen transaksi tidak bermerek platform.

import { DocLogo } from "@/components/property/DocLogo";
import type { LogoPosition } from "@/lib/branding/branding";
import { computeBookingBalance, purposeLabel, type KwitansiForm } from "@/lib/documents/kwitansiTypes";
import { formatSignDate, rupiah } from "@/lib/documents/mouTypes";
import { terbilangRupiah } from "@/lib/documents/terbilang";


function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-[3px] leading-snug">
      <span className="w-[34%] shrink-0">{label}</span>
      <span className="shrink-0">:</span>
      <span className="min-w-0 flex-1 font-medium break-words">{children || "-"}</span>
    </div>
  );
}

export function KwitansiDocument({ form, docNumber, logoUrl = null, logoPosition = null }: { form: KwitansiForm; docNumber: string; logoUrl?: string | null; logoPosition?: LogoPosition | null }) {
  const { buyer, unit, payment, party2 } = form;
  const amount = Number(String(payment.amount).replace(/[^0-9.-]/g, "")) || 0;
  const price = Number(String(unit.price).replace(/[^0-9.-]/g, "")) || 0;
  const balance = computeBookingBalance(unit, amount, payment.previouslyPaid);
  const purpose = purposeLabel(payment);
  const words = terbilangRupiah(amount);

  return (
    <div className="kw-doc w-full text-[13px] leading-relaxed text-black">
      {(logoPosition ?? "left") === "center" ? (
        <div className="border-b-2 border-black pb-2">
          <div className="flex justify-center">
            <DocLogo logoUrl={logoUrl} name={party2.officeName || party2.companyName} className="h-14 w-auto" />
          </div>
          <div className="mt-1 text-center">
            <h1 className="text-lg font-bold tracking-wide">KWITANSI</h1>
            <p className="text-[0.9em]">{purpose}</p>
          </div>
        </div>
      ) : (
        <div className={`flex items-center justify-between border-b-2 border-black pb-2 ${logoPosition === "right" ? "flex-row-reverse" : ""}`}>
          <DocLogo logoUrl={logoUrl} name={party2.officeName || party2.companyName} className="h-14 w-auto" />
          <div className={logoPosition === "right" ? "text-left" : "text-right"}>
            <h1 className="text-lg font-bold tracking-wide">KWITANSI</h1>
            <p className="text-[0.9em]">{purpose}</p>
          </div>
        </div>
      )}

      <p className="mt-3 text-right">
        No. : <strong>{docNumber || "(dibuat saat disimpan)"}</strong>
      </p>

      <div className="mt-3">
        <Row label="Sudah terima dari">{buyer.name}</Row>
        {buyer.address && <Row label="Alamat">{buyer.address}</Row>}
        {buyer.phone && <Row label="No. telepon">{buyer.phone}</Row>}
        <Row label="Uang sejumlah">
          <span className="italic">{words ? `${words}` : "-"}</span>
        </Row>
        <Row label="Untuk pembayaran">{purpose}</Row>
      </div>

      <div className="mt-3 rounded border border-black/60 p-3 print-avoid-break">
        <p className="mb-1 font-semibold">Rincian unit</p>
        <Row label="Proyek / properti">{unit.projectName}</Row>
        <Row label="Blok / No. unit">{unit.unitLabel}</Row>
        <Row label="Tipe">{unit.type}</Row>
        {price > 0 && <Row label="Harga unit">{rupiah(price)}</Row>}
        <Row label="Metode pembayaran">{balance.method}</Row>
        {balance.usesDp && balance.base > 0 && <Row label="Total DP">{rupiah(balance.base)}</Row>}
        {balance.before > 0 && <Row label="Sudah dibayar sebelumnya">{rupiah(balance.before)}</Row>}
        <Row label={`Pembayaran ini (${purpose})`}>
          <strong>{rupiah(amount)}</strong>
        </Row>
        {balance.remaining !== null && (
          <Row label="Sisa pembayaran">
            {rupiah(balance.remaining)}
            {balance.usesDp && <span className="font-normal text-[0.85em]"> (Total DP dikurangi pembayaran)</span>}
          </Row>
        )}
        <Row label="Cara pembayaran">{payment.method}</Row>
        {payment.method === "Transfer" && party2.bankName && (
          <Row label="Rekening penerima">
            {party2.bankName} {party2.accountNumber} a.n. {party2.accountName}
          </Row>
        )}
      </div>

      <div className="mt-3 inline-block rounded border-2 border-black px-4 py-2 text-base font-bold print-avoid-break">
        {rupiah(amount)}
      </div>

      {payment.notes && (
        <div className="mt-3 print-avoid-break">
          <p className="font-semibold">Catatan:</p>
          <p className="whitespace-pre-wrap text-justify">{payment.notes}</p>
        </div>
      )}

      <p className="mt-4 print-avoid-break">
        {form.signPlace || "..................."}, {formatSignDate(payment.date)}
      </p>
      <div className="mt-1 grid grid-cols-2 gap-6 text-center print-avoid-break">
        <div>
          <p>Pembeli</p>
          <div className="h-20" />
          <p className="font-semibold underline">{buyer.name || "..................."}</p>
        </div>
        <div>
          <p>Penerima</p>
          <p className="text-[0.85em]">{party2.officeName}</p>
          <div className="mx-auto my-1 flex h-16 w-24 items-center justify-center rounded border border-dashed border-black/40 text-[0.75em] text-black/50">
            Meterai
          </div>
          <p className="font-semibold underline">{party2.agentName || "..................."}</p>
        </div>
      </div>
      {party2.companyName && <p className="mt-4 text-center text-[0.85em] text-black/70">{party2.companyName}{party2.officeAddress ? ` -- ${party2.officeAddress}` : ""}</p>}
    </div>
  );
}
