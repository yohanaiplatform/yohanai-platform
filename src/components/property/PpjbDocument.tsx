// src/components/property/PpjbDocument.tsx
//
// Isi dokumen PPJB (presentasional): pratinjau di layar dan isi cetak. Tata letak mengikuti PPJB Kapur Mas Residence:
// logo di tengah, judul, nomor, data Pembeli dan Penjual, rincian properti, ketentuan bernomor, tanda tangan Penjual/Pembeli/Saksi.
// Logo perusahaan (bukan Yohan.AI).

import { computeBookingBalance } from "@/lib/documents/kwitansiTypes";
import { formatBirthLong, formatLongDate, renderClause, rupiahWithWords, type PpjbForm, type PpjbPerson } from "@/lib/documents/ppjbTypes";

const LOGO = "/images/brand/griya-indonesia-logo.png";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-[1px] leading-snug">
      <span className="w-[30%] shrink-0">{label}</span>
      <span className="shrink-0">:</span>
      <span className="min-w-0 flex-1 break-words">{children || "-"}</span>
    </div>
  );
}

function PersonBlock({ index, person, role, company }: { index: number; person: PpjbPerson; role: string; company?: string }) {
  return (
    <div className="mb-2">
      <div className="flex gap-2">
        <span className="w-4 shrink-0">{index}.</span>
        <div className="min-w-0 flex-1">
          <Row label="Nama">
            <strong>{person.name}</strong>
          </Row>
          <Row label="Tempat & Tgl Lahir">{formatBirthLong(person.birthPlace, person.birthDate)}</Row>
          <Row label="Alamat">{person.address}</Row>
          <Row label="Nomor KTP">{person.idNumber}</Row>
          {person.phone && <Row label="No. HP">{person.phone}</Row>}
          {company ? (
            <p className="mt-1">
              Mewakili Perusahaan Developer <strong>{company}</strong> yang selanjutnya disebut <strong>{role}</strong>
            </p>
          ) : (
            <p className="mt-1">
              Untuk selanjutnya disebut sebagai <strong>{role}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PpjbDocument({ form, docNumber }: { form: PpjbForm; docNumber: string }) {
  const { buyer, seller, property: p, party2 } = form;
  const balance = computeBookingBalance({ price: p.price, purchaseMethod: p.method, totalDp: p.totalDp }, p.booking);
  const clauses = form.clauses.map((c) => renderClause(c, form)).filter((c) => c.trim());
  const dateText = form.signDate ? formatLongDate(form.signDate) : "";

  return (
    <div className="ppjb-doc w-full text-[13px] leading-relaxed text-black">
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt={party2.officeName || "Logo perusahaan"} className="h-14 w-auto" />
      </div>
      <h1 className="mt-2 text-center text-sm font-bold">PERJANJIAN PENGIKATAN JUAL BELI ( PPJB )</h1>
      <p className="mb-3 text-center text-[0.95em]">Nomor : {docNumber || "(dibuat saat disimpan)"}</p>

      <p className="mb-2">Yang bertandatangan di bawah ini adalah :</p>
      <PersonBlock index={1} person={buyer} role="Pembeli" />
      <PersonBlock index={2} person={seller} role="Penjual" company={seller.company} />

      <p className="mb-1 print-avoid-break">
        <strong>Penjual</strong> dan <strong>Pembeli</strong> telah bersepakat untuk melakukan jual beli properti sebagai berikut :
      </p>
      <div className="mb-3 ml-4 print-avoid-break">
        <Row label="Properti">
          {p.kind} <strong>{p.type}</strong>
          {p.complexName ? <> di {p.complexName}</> : null}
          {p.unitNo ? <> -- No. <strong>{p.unitNo}</strong></> : null}
        </Row>
        <Row label="Alamat">{p.address}</Row>
        <Row label="SHM Nomor">{p.shmNumber}</Row>
        <Row label="Harga Unit">{rupiahWithWords(p.price)}</Row>
        <Row label="Booking Unit (DP)">{rupiahWithWords(p.booking)}</Row>
        {balance.usesDp && balance.base > 0 && <Row label="Total DP">{rupiahWithWords(balance.base)}</Row>}
        <Row label="Pembayaran">{p.method}</Row>
      </div>

      <p className="mb-1 font-semibold" style={{ breakAfter: "avoid" }}>
        Ketentuan kesepakatan jual beli :
      </p>
      <ol className="mb-3 ml-5 list-decimal space-y-1 text-justify">
        {clauses.map((c, i) => (
          <li key={i} className="whitespace-pre-wrap">
            {c}
          </li>
        ))}
      </ol>

      <p className="mt-3 print-avoid-break">
        {form.signPlace || "..................."}, {dateText}
      </p>
      <div className="mt-1 grid grid-cols-3 gap-4 text-center print-avoid-break">
        <div>
          <p className="font-semibold">Penjual</p>
          <p className="text-[0.85em]">{seller.company}</p>
          <div className="h-16" />
          <p className="font-semibold underline">{seller.name || "..................."}</p>
          <p className="text-[0.85em]">{seller.company}</p>
        </div>
        <div>
          <p className="font-semibold">Pembeli</p>
          <div className="h-[calc(1rem+4rem)]" />
          <p className="font-semibold underline">{buyer.name || "..................."}</p>
          <p className="text-[0.85em]">(Konsumen)</p>
        </div>
        <div>
          <p className="font-semibold">Saksi</p>
          <p className="text-[0.85em]">{party2.officeName}</p>
          <div className="h-16" />
          <p className="font-semibold underline">{party2.agentName || "..................."}</p>
          <p className="text-[0.85em]">(Marketing)</p>
        </div>
      </div>
      {form.footnote && <p className="mt-3 text-[0.85em]">{form.footnote}</p>}
    </div>
  );
}
