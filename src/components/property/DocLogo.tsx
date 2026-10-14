// src/components/property/DocLogo.tsx
//
// Logo header dokumen (MoU/Kwitansi/PPJB): gambar milik pengguna (Settings, Logo & Watermark) atau, kalau belum diatur,
// nama kantor sebagai teks. Tidak pernah memakai logo Yohan.AI (dokumen perjanjian tidak bermerek platform).

export function DocLogo({ logoUrl, name, className }: { logoUrl: string | null; name: string; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name || "Logo"} className={className ?? "h-14 w-auto"} />;
  }
  return <p className="text-base font-bold uppercase tracking-wide">{name || "Nama kantor"}</p>;
}
