// src/lib/branding/processImage.ts
//
// Penyesuaian otomatis logo/watermark DI BROWSER supaya pengguna boleh mengunggah gambar apa saja: hapus latar polos (watermark),
// potong tepi kosong, tambah ruang agar proporsional, perbesar/perkecil ke ukuran standar, dan keluarkan PNG yang memenuhi
// standar (spec.ts). Server tetap memeriksa ulang hasilnya. Hanya dipakai di komponen client.

import { BRANDING_SPECS, MIN_TRANSPARENT_RATIO, type BrandingKind } from "@/lib/branding/spec";

/** Batas sisi terpanjang kerja (gambar raksasa diperkecil dulu agar memori aman). */
const WORK_MAX_SIDE = 2400;
/** Lebar hasil akhir bila sumber lebih besar (cukup tajam untuk cetak dan watermark ~620px). */
const TARGET_MAX_WIDTH = 1200;
/** Ambang jarak warna: <= T1 dianggap latar (transparan penuh), >= T2 dianggap isi (tidak transparan). */
const BG_T1 = 28;
const BG_T2 = 90;

/** Gambar tidak bisa disesuaikan otomatis; pesan berisi cara memperbaikinya. */
export class BrandingProcessError extends Error {}

export interface ProcessedImage {
  blob: Blob;
  /** Object URL untuk pratinjau; panggil URL.revokeObjectURL saat tidak dipakai. */
  url: string;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  /** Catatan penyesuaian yang dilakukan, ditampilkan ke pengguna. */
  notes: string[];
  mime: "image/png" | "image/jpeg";
}

function colorDistance(r: number, g: number, b: number, br: number, bg: number, bb: number): number {
  return Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new BrandingProcessError("Gagal membuat gambar hasil (memori perangkat?)."))), mime, quality);
  });
}

function drawScaled(source: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dw: number, dh: number, dx = 0, dy = 0, canvasW = dw, canvasH = dh): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(canvasW));
  out.height = Math.max(1, Math.round(canvasH));
  const ctx = out.getContext("2d");
  if (!ctx) throw new BrandingProcessError("Browser tidak mendukung pengolahan gambar.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
  return out;
}

function transparentRatioOf(canvas: HTMLCanvasElement): number {
  const scale = Math.min(1, 240 / Math.max(canvas.width, canvas.height));
  const small = drawScaled(canvas, 0, 0, canvas.width, canvas.height, canvas.width * scale, canvas.height * scale);
  const ctx = small.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 1;
  const data = ctx.getImageData(0, 0, small.width, small.height).data;
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) transparent += 1;
  return transparent / (data.length / 4);
}

export async function processBrandingImage(file: File, kind: BrandingKind, options: { removeBackground: boolean }): Promise<ProcessedImage> {
  const spec = BRANDING_SPECS[kind];
  const notes: string[] = [];

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new BrandingProcessError("Gambar tidak bisa dibaca. Pastikan file gambar yang valid (PNG, JPG, atau WebP).");
  }
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;

  // 1) Gambar kerja (diperkecil bila raksasa)
  const workScale = Math.min(1, WORK_MAX_SIDE / Math.max(sourceWidth, sourceHeight));
  const work = drawScaled(bitmap, 0, 0, sourceWidth, sourceHeight, sourceWidth * workScale, sourceHeight * workScale);
  const wctx = work.getContext("2d", { willReadFrequently: true });
  if (!wctx) throw new BrandingProcessError("Browser tidak mendukung pengolahan gambar.");
  const image = wctx.getImageData(0, 0, work.width, work.height);
  const px = image.data;
  const total = work.width * work.height;

  let transparentPixels = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 250) transparentPixels += 1;
  const hadTransparency = transparentPixels / total > 0.01;

  // 2) Watermark butuh latar transparan: hapus latar polos kalau gambar belum transparan
  if (kind === "watermark" && !hadTransparency) {
    if (!options.removeBackground) {
      throw new BrandingProcessError("Gambar ini tidak transparan. Centang \"Hapus latar belakang polos otomatis\" atau unggah PNG berlatar transparan.");
    }
    const corner = (cx: number, cy: number) => {
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const x = Math.min(work.width - 1, Math.max(0, cx + dx - 1));
          const y = Math.min(work.height - 1, Math.max(0, cy + dy - 1));
          const i = (y * work.width + x) * 4;
          r += px[i]; g += px[i + 1]; b += px[i + 2]; n += 1;
        }
      }
      return [r / n, g / n, b / n];
    };
    const corners = [corner(1, 1), corner(work.width - 2, 1), corner(1, work.height - 2), corner(work.width - 2, work.height - 2)];
    const [br, bg, bb] = corners[0];
    if (corners.some((c) => colorDistance(c[0], c[1], c[2], br, bg, bb) > 40)) {
      throw new BrandingProcessError("Latar belakang gambar tidak polos (bukan satu warna rata) sehingga tidak bisa dihapus otomatis. Gunakan logo berlatar polos/transparan, atau hapus latarnya dengan aplikasi edit gambar lalu simpan sebagai PNG.");
    }
    for (let i = 0; i < px.length; i += 4) {
      const d = colorDistance(px[i], px[i + 1], px[i + 2], br, bg, bb);
      const alpha = d <= BG_T1 ? 0 : d >= BG_T2 ? 255 : ((d - BG_T1) / (BG_T2 - BG_T1)) * 255;
      px[i + 3] = Math.min(px[i + 3], alpha);
    }
    wctx.putImageData(image, 0, 0);
    notes.push("Latar belakang polos dihapus otomatis.");
  }

  // 3) Potong tepi kosong (transparan / putih) dengan sedikit ruang
  // Logo yang OPAK (tanpa transparansi): putih dianggap latar. Logo bertransparansi: hanya piksel transparan yang dianggap kosong
  // (teks putih di atas transparan tetap isi).
  const whiteIsBackground = kind === "logo" && !hadTransparency;
  const isContent = (i: number) => {
    if (px[i + 3] <= 12) return false;
    if (whiteIsBackground && px[i] > 244 && px[i + 1] > 244 && px[i + 2] > 244) return false;
    return true;
  };
  let minX = work.width, minY = work.height, maxX = -1, maxY = -1;
  let brightnessSum = 0;
  let brightnessCount = 0;
  for (let y = 0; y < work.height; y++) {
    for (let x = 0; x < work.width; x++) {
      const idx = (y * work.width + x) * 4;
      if (isContent(idx)) {
        brightnessSum += (px[idx] + px[idx + 1] + px[idx + 2]) / 3;
        brightnessCount += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (kind === "logo" && brightnessCount > 0 && brightnessSum / brightnessCount > 235) {
    notes.push("Logo hampir seluruhnya berwarna putih; di dokumen berlatar putih akan sulit terlihat. Gunakan versi logo yang berwarna.");
  }
  if (maxX < 0) throw new BrandingProcessError("Gambar tampak kosong (tidak ada logo/teks yang terlihat). Pilih gambar lain.");
  const pad = Math.round(Math.max(maxX - minX + 1, maxY - minY + 1) * 0.03);
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(work.width, maxX + 1 + pad) - cropX;
  const cropH = Math.min(work.height, maxY + 1 + pad) - cropY;
  if (cropW * cropH < work.width * work.height * 0.97) notes.push("Tepi kosong di sekeliling logo dipotong.");

  // 4) Proporsi sesuai standar: tambah ruang kosong (transparan) bila terlalu lebar atau terlalu menjulang
  let boxW = cropW;
  let boxH = cropH;
  if (boxW / boxH > spec.maxRatio) {
    boxH = Math.ceil(boxW / spec.maxRatio);
    notes.push("Ditambah ruang kosong di atas/bawah agar proporsi gambar sesuai standar.");
  } else if (boxW / boxH < spec.minRatio) {
    boxW = Math.ceil(boxH * spec.minRatio);
    notes.push("Ditambah ruang kosong di kiri/kanan agar proporsi gambar sesuai standar.");
  }

  // 5) Ukuran akhir
  let outW = Math.min(TARGET_MAX_WIDTH, Math.max(boxW, spec.minWidth));
  outW = Math.max(outW, Math.ceil((spec.minHeight * boxW) / boxH));
  outW = Math.min(outW, spec.maxWidth);
  const factor = outW / boxW;
  if (factor > 1.8) {
    notes.push(`Logo di dalam gambar berukuran kecil (${Math.round(cropW / workScale)} x ${Math.round(cropH / workScale)}px), diperbesar sekitar ${factor.toFixed(1)}x sehingga hasil bisa kurang tajam. Pakai gambar yang lebih besar jika ada.`);
  } else if (factor > 1.05) {
    notes.push("Gambar diperbesar sedikit ke ukuran standar.");
  } else if (factor < 0.95) {
    notes.push("Gambar diperkecil ke ukuran standar.");
  }

  const render = (width: number) => {
    const f = width / boxW;
    const h = Math.round(boxH * f);
    const dx = ((boxW - cropW) / 2) * f;
    const dy = ((boxH - cropH) / 2) * f;
    return drawScaled(work, cropX, cropY, cropW, cropH, cropW * f, cropH * f, dx, dy, width, h);
  };

  // 6) Ekspor PNG; kalau terlalu besar perkecil bertahap (logo biasa boleh JPEG berlatar putih)
  let width = outW;
  let canvas = render(width);
  let blob = await canvasToBlob(canvas, "image/png");
  let mime: ProcessedImage["mime"] = "image/png";
  while (blob.size > spec.maxBytes && width * 0.85 >= spec.minWidth) {
    width = Math.round(width * 0.85);
    canvas = render(width);
    blob = await canvasToBlob(canvas, "image/png");
  }
  if (blob.size > spec.maxBytes && kind === "logo") {
    const flat = document.createElement("canvas");
    flat.width = canvas.width;
    flat.height = canvas.height;
    const fctx = flat.getContext("2d");
    if (fctx) {
      fctx.fillStyle = "#ffffff";
      fctx.fillRect(0, 0, flat.width, flat.height);
      fctx.drawImage(canvas, 0, 0);
      blob = await canvasToBlob(flat, "image/jpeg", 0.9);
      mime = "image/jpeg";
      notes.push("Logo diubah ke JPG berlatar putih agar ukuran file sesuai batas.");
    }
  }
  if (blob.size > spec.maxBytes) {
    throw new BrandingProcessError("Ukuran file hasil masih terlalu besar. Gunakan gambar yang lebih sederhana (logo/teks saja, tanpa foto).");
  }

  // 7) Watermark: pastikan bukan kotak penuh
  if (kind === "watermark" && transparentRatioOf(canvas) < MIN_TRANSPARENT_RATIO) {
    throw new BrandingProcessError("Hampir seluruh gambar tidak transparan (kotak penuh) sehingga akan menutupi foto. Gunakan logo/teks berlatar transparan atau berlatar polos.");
  }

  return { blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height, sourceWidth, sourceHeight, notes, mime };
}
