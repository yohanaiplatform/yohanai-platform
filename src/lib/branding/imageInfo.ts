// src/lib/branding/imageInfo.ts
//
// Baca format, dimensi, dan kanal alpha dari byte gambar (server-side, tanpa library). Dipakai untuk memeriksa unggahan
// logo/watermark berdasarkan ISI file (bukan hanya tipe yang dikirim browser).

import type { BrandingImageInfo } from "@/lib/branding/spec";

function parsePng(buf: Buffer): BrandingImageInfo | null {
  // Signature 8 byte + chunk IHDR: panjang(4) 'IHDR'(4) lebar(4) tinggi(4) bitDepth(1) colorType(1)
  if (buf.length < 33 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf[25];
  let hasAlpha = colorType === 4 || colorType === 6;
  if (!hasAlpha) {
    // PNG berpalet/abu-abu/RGB bisa transparan lewat chunk tRNS.
    let offset = 8;
    while (offset + 8 <= buf.length) {
      const length = buf.readUInt32BE(offset);
      const type = buf.toString("ascii", offset + 4, offset + 8);
      if (type === "tRNS") {
        hasAlpha = true;
        break;
      }
      if (type === "IDAT" || type === "IEND") break;
      offset += 12 + length;
    }
  }
  return { format: "png", width, height, bytes: buf.length, hasAlpha };
}

function parseJpeg(buf: Buffer): BrandingImageInfo | null {
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    // SOF0..SOF15 kecuali DHT (C4), JPG (C8), DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { format: "jpeg", height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7), bytes: buf.length, hasAlpha: false };
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  return null;
}

/** Format dikenali dari byte awal. Return null kalau bukan PNG/JPEG yang valid. */
export function readImageInfo(buf: Buffer): BrandingImageInfo | null {
  const isPng = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (isPng) return parsePng(buf);
  const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (isJpeg) return parseJpeg(buf);
  return null;
}
