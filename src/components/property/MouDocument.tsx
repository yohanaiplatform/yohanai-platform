// src/components/property/MouDocument.tsx
//
// Isi dokumen "Surat Perjanjian Jasa Pemasaran" (MoU Pemasaran) -- presentasional murni, dipakai sebagai pratinjau di layar
// dan sebagai isi cetak/PDF. Teks pasal mengikuti dokumen MoU yang dipakai Griya Indonesia (GDI/2025/44). Header memakai
// logo perusahaan (BUKAN logo Yohan.AI -- dokumen perjanjian tidak boleh bermerek platform).

import { DocLogo } from "@/components/property/DocLogo";
import type { MouForm, MouListingInfo } from "@/lib/documents/mouTypes";
import { formatSignDate, rupiah } from "@/lib/documents/mouTypes";


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-[1px] leading-snug">
      <span className="w-[42%] shrink-0">{label}</span>
      <span className="shrink-0">:</span>
      <span className="min-w-0 flex-1 font-medium break-words">{children || "-"}</span>
    </div>
  );
}

function Signatures({ form, ownerLabel = true }: { form: MouForm; ownerLabel?: boolean }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-4 text-center print-avoid-break">
      <div>
        <p>Pihak 1</p>
        {ownerLabel && <p className="text-[0.85em]">Pemilik Properti / Perwakilan</p>}
        <div className="h-14" />
        <p className="font-semibold underline">{form.owner.name || "..................."}</p>
      </div>
      <div>
        <p>Pihak 2</p>
        <p className="text-[0.85em]">Agen Properti</p>
        <div className="h-14" />
        <p className="font-semibold underline">{form.party2.agentName || "..................."}</p>
      </div>
      <div>
        <p>Mengetahui</p>
        <p className="text-[0.85em]">Pimpinan/Principal</p>
        <div className="h-14" />
        <p className="font-semibold underline">{form.party2.principalName || "..................."}</p>
      </div>
    </div>
  );
}

export function MouDocument({ form, listing, code, logoUrl = null }: { form: MouForm; listing: MouListingInfo; code: string; logoUrl?: string | null }) {
  const { owner, party2, property, agreement } = form;
  const commission = property.commissionPct ? `${property.commissionPct}%` : "";
  const dateText = formatSignDate(agreement.signDate);

  const specs: [string, string][] = [];
  if (listing.landArea) specs.push(["Luas Tanah (m2)", String(listing.landArea)]);
  if (listing.buildingArea) specs.push(["Luas Bangunan (m2)", String(listing.buildingArea)]);
  if (listing.bedrooms !== null) specs.push(["Kamar Tidur", String(listing.bedrooms)]);
  if (listing.bathrooms !== null) specs.push(["Kamar Mandi", String(listing.bathrooms)]);
  if (listing.carport !== null) specs.push(["Carport", listing.carport > 0 ? `Ada (${listing.carport})` : "Tidak"]);

  return (
    <table className="mou-table w-full border-collapse text-[13px] leading-relaxed text-black">
      <thead>
        <tr>
          <td className="pb-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <DocLogo logoUrl={logoUrl} name={party2.officeName || party2.companyName} className="h-14 w-auto" />
              <p className="text-right text-[0.9em]">
                Listing ID : <strong>{code || "(dibuat saat disimpan)"}</strong>
              </p>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="align-top">
            <h1 className="text-center text-base font-bold">SURAT PERJANJIAN</h1>
            <h2 className="mb-3 text-center text-base font-bold">JASA PEMASARAN - {agreement.kind}</h2>

            <p className="mb-2">Yang bertandatangan dibawah ini :</p>

            <p className="font-semibold">1. Pihak 1 (Pemilik)</p>
            <div className="mb-2 ml-4">
              <Field label="Nama">{owner.name}</Field>
              <Field label="Tempat Tanggal Lahir">{owner.birthInfo}</Field>
              <Field label="Alamat">{owner.address}</Field>
              <Field label="Pekerjaan">{owner.occupation}</Field>
              <Field label="Nomor KTP / SIM">{owner.idNumber}</Field>
              <Field label="Nomor Telepon">{owner.phone}</Field>
              <p className="mt-1">Yang selanjutnya disebut sebagai <strong>Pihak 1</strong></p>
            </div>

            <p className="font-semibold">2. Pihak 2 (Agen)</p>
            <div className="mb-2 ml-4">
              <Field label="Nama">{party2.agentName}</Field>
              <Field label="Kantor Agen Properti">{party2.officeName}</Field>
              <Field label="Perusahaan">{party2.companyName}</Field>
              <Field label="Alamat Kantor">{party2.officeAddress}</Field>
              <p className="mt-1">Yang selanjutnya disebut sebagai <strong>Pihak 2</strong></p>
            </div>

            <p className="mb-2">Pihak 1 dan Pihak 2 secara bersama-sama dapat disebut sebagai Para Pihak.</p>
            <p className="mb-1">Dengan ini Pihak 1 memberikan izin kepada Pihak 2 untuk memasarkan properti sebagai berikut :</p>
            <div className="mb-3 ml-4 print-avoid-break">
              <Field label="Nama / Jenis Properti">{property.type}</Field>
              <Field label="Jumlah Unit">{property.units}</Field>
              <Field label="Penawaran">{property.offer}</Field>
              <Field label="Lokasi">{property.location}</Field>
              <Field label="Sertifikat & Nomor">{[property.certificate, property.certificateNumber].filter(Boolean).join(", ")}</Field>
              <Field label="Harga Penawaran">{rupiah(property.price)}</Field>
              <Field label="Komisi">{commission || rupiah(property.commissionNominal)}</Field>
              <Field label="Closing Fee">{rupiah(property.closingFee)}</Field>
              <p className="mt-1">Yang selanjutnya disebut <strong>Properti</strong></p>
            </div>

            <p className="font-semibold">DEFINISI :</p>
            <p className="mb-1">Para Pihak terlebih dahulu menerangkan hal-hal sebagai berikut:</p>
            <ol className="mb-3 ml-5 list-decimal space-y-1 text-justify">
              <li><strong>Perjanjian Eksklusif</strong>, adalah perjanjian jasa pemasaran properti dimana Pihak 2 mendapatkan prioritas untuk memasarkan selama jangka waktu tertentu yang selanjutnya disebut Masa Perjanjian Eksklusif.</li>
              <li><strong>Perjanjian Non-Eksklusif</strong>, adalah perjanjian jasa pemasaran properti dimana Pihak 2 tidak mendapatkan prioritas sebagai jasa pemasaran dan Pihak 1 dapat menunjuk Pihak lain secara bersama-sama memasarkan properti, komisi hanya dibayarkan kepada Pihak yang berhasil menjual / menyewakan properti.</li>
              <li><strong>Komisi</strong> adalah imbalan dari jasa pemasaran yang diberikan oleh Pihak 1 kepada Pihak 2 atas konsumen yang direferensikan oleh Pihak 2 terhadap Jual Beli / Sewa Properti yang dimaksud.</li>
              <li><strong>Closing Fee</strong> adalah komisi awal yang dicairkan / dibayarkan Pihak 1 kepada Pihak 2 saat konsumen melakukan pembayaran uang tanda jadi atau uang muka.</li>
              <li>Dalam Masa Perjanjian Eksklusif Pihak 1 akan membayar komisi penuh sesuai yang tertera jika properti terjual / tersewa melalui Pihak 2.</li>
              <li>Dalam Masa Perjanjian Eksklusif Pihak 1 akan membayar komisi senilai setengah dari nilai komisi di perjanjian jika properti terjual / tersewa melalui pihak lain.</li>
              <li>Jika Masa Perjanjian Eksklusif telah habis maka perjanjian Eksklusif secara otomatis berubah menjadi perjanjian Non-Eksklusif dengan jangka waktu pemasaran selama 1 tahun setelah masa perjanjian Eksklusif berakhir.</li>
            </ol>

            <p className="font-semibold" style={{ breakAfter: "avoid" }}>Kesepakatan Kerjasama Pemasaran :</p>
            <ol className="mb-3 ml-5 list-decimal space-y-1 text-justify">
              <li>Para Pihak bersepakat bahwa jenis perjanjian ini adalah <strong>{agreement.kind}</strong> selama <strong>{agreement.months || "12"} Bulan</strong>.</li>
              <li>Pihak 1 menjamin bahwa Pihak 1 adalah Pemilik sah atau yang dikuasakan oleh pemilik untuk memberi izin kepada Pihak 2 untuk memasarkan properti dimaksud.</li>
              <li>Pihak 1 menjamin bahwa Properti tersebut diatas tidak dalam sengketa dengan pihak manapun termasuk dengan para ahli waris yang tertera dalam dokumen sertifikat.</li>
              <li>Pihak 2 berhak menggunakan semua materi promosi baik yang disiapkan oleh Pihak 1 ataupun yang diproduksi dalam bentuk media cetak, media elektronik, maupun visual untuk tujuan komersial atau pemasaran properti.</li>
              <li>Pihak 1 mengizinkan Pihak 2 untuk mencantumkan logo perusahaan Pihak 2 dan mencantumkan nomor telepon / kontak / email dan alamat website pada setiap materi promosi.</li>
              <li>Closing Fee tidak dikembalikan oleh pihak 2 apabila calon pembeli tidak menuntaskan proses jual beli atau sewa hingga tahap penandatangan akad jual-beli dan terhadap calon pembeli / penyewa closing fee dianggap sebagai biaya wanprestasi yang tercantum dalam PPJB.</li>
              <li>
                Komisi maupun Closing Fee atas jasa pemasaran pada perjanjian ini akan dibayarkan oleh Pihak 1 kepada Pihak 2 melalui rekening perusahaan berikut ini :
                <div className="mt-1">
                  <Field label="Nama Bank">{party2.bankName}</Field>
                  <Field label="Nomor Rekening">{party2.accountNumber}</Field>
                  <Field label="Atas Nama">{party2.accountName}</Field>
                </div>
              </li>
            </ol>

            <p className="print-avoid-break">
              Perjanjian ini ditandatangani di <strong>{agreement.signPlace || "..................."}</strong>, Pada Tanggal: <strong>{dateText}</strong>
            </p>
            <Signatures form={form} />

            <div className="print-avoid-break mt-4">
              <h3 className="mb-1 font-semibold">Komitmen, Kerahasiaan dan Korespondensi</h3>
              <ol className="ml-5 list-decimal space-y-1 text-justify">
                <li>
                  Apabila dikemudian hari terjadi perubahan pada data properti maka Pihak 1 wajib menginformasikan kepada Pihak 2 via telepon, whatsapp, atau melalui email
                  {party2.officeEmail ? <> ke alamat <strong>{party2.officeEmail}</strong></> : null}.
                </li>
                <li>Para pihak setuju untuk menjaga kerahasiaan informasi yang tercantum dalam dokumen ini dengan cara tidak disebarluaskan kepada pihak lain yang tidak terkait dengan perjanjian ini kecuali telah disepakati oleh para pihak.</li>
                <li>Perjanjian ini bisa ditandatangani secara manual maupun secara elektronik dan para pihak telah setuju untuk mematuhi seluruh kesepakatan yang tertera.</li>
              </ol>
            </div>

            {/* Lampiran */}
            <div className="mou-page-break">
              <h2 className="mb-3 text-center text-base font-bold">Lampiran Perjanjian</h2>

              <p className="mb-1 font-semibold">Data Agent</p>
              <div className="mb-3 ml-4">
                <Field label="Nama Agent">{party2.agentName}</Field>
                <Field label="Service Area">{party2.serviceArea}</Field>
                <Field label="Jenis Perjanjian">{agreement.kind}</Field>
              </div>

              <p className="mb-1 font-semibold">Data Pemilik / Vendor</p>
              <div className="mb-3 ml-4">
                <Field label="Pemilik/Wakil">{owner.name}</Field>
                <Field label="Alamat">{owner.address}</Field>
                <Field label="Pekerjaan">{owner.occupation}</Field>
                <Field label="Tanggal Lahir">{owner.birthInfo}</Field>
                <Field label="No. KTP">{owner.idNumber}</Field>
                <Field label="No. HP/WA">{owner.phone}</Field>
              </div>

              <p className="mb-1 font-semibold">Data Properti</p>
              <div className="mb-3 ml-4">
                <Field label="Judul properti">{listing.title}</Field>
                <Field label="Jenis Properti">{property.type}</Field>
                <Field label="Lokasi Properti">{property.location}</Field>
                <Field label="Jumlah Unit / Kavling">{property.units}</Field>
                <Field label="Penawaran">{property.offer}</Field>
                <Field label="Sertifikat">{[property.certificate, property.certificateNumber].filter(Boolean).join(", ")}</Field>
                <Field label="Harga Penawaran">{rupiah(property.price)}</Field>
              </div>

              {specs.length > 0 && (
                <div className="print-avoid-break">
                  <p className="mb-1 font-semibold">Spesifikasi Properti :</p>
                  <div className="mb-3 ml-4 grid grid-cols-2 gap-x-6">
                    {specs.map(([label, value]) => (
                      <Field key={label} label={label}>
                        {value}
                      </Field>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3 ml-4">
                <Field label="Deskripsi Properti">{property.description}</Field>
              </div>

              <p className="mb-1 font-semibold">Data Perjanjian Pemasaran</p>
              <div className="mb-3 ml-4 print-avoid-break">
                <Field label="Mulai Dipasarkan">{dateText}</Field>
                <Field label="Komisi (%)">{commission}</Field>
                <Field label="Nominal Komisi">{rupiah(property.commissionNominal)}</Field>
                <Field label="Closing Fee">{rupiah(property.closingFee)}</Field>
                <Field label="Pemasangan Spanduk">{agreement.banner === "YA" ? "YA, Diizinkan" : "TIDAK Diizinkan"}</Field>
                <Field label="Status Pemasaran">{agreement.kind}</Field>
                <Field label="Dokumen">{agreement.documents}</Field>
                <Field label="Info Tambahan">{agreement.extraInfo}</Field>
              </div>

              <p className="print-avoid-break">
                Detail Properti ini telah diperiksa oleh kedua belah pihak Pada Tanggal: <strong>{dateText}</strong>
              </p>
              <Signatures form={form} />

            </div>

            {/* Dokumen pendukung: mengalir setelah lampiran (halaman baru hanya bila tidak muat) */}
            <div className="mt-4">
              <div className="print-avoid-break">
              <h2 className="mb-2 text-center text-base font-bold" style={{ breakAfter: "avoid" }}>Dokumen Pendukung</h2>
              <p className="mb-1 font-semibold">Identitas Diri Pihak 1 (KTP) :</p>
              {owner.idPhoto ? (
                <div className="mb-3 flex justify-center print-avoid-break">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={owner.idPhoto} alt="KTP Pihak 1" className="max-h-[200px] w-auto max-w-full rounded border border-black/20 object-contain" />
                </div>
              ) : (
                <div className="mb-3 flex h-24 items-center justify-center rounded border border-dashed border-black/40 text-[0.85em] text-black/50">
                  Belum ada foto KTP (unggah di formulir atau tempelkan fotokopi)
                </div>
              )}
              </div>
              <div className="print-avoid-break">
              <p className="mb-1 font-semibold">Foto Unit / Properti :</p>
              {listing.photoUrls.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded border border-dashed border-black/40 text-[0.85em] text-black/50">
                  Belum ada foto listing
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {listing.photoUrls.slice(0, 4).map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="Foto properti" className="h-28 w-full rounded border border-black/20 object-cover" />
                  ))}
                </div>
              )}
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
