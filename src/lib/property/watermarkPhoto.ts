// src/lib/property/watermarkPhoto.ts

const LOGO_SRC = "/images/logo/logo-dark.png"; // versi teks putih -- header, BUKAN app-icon.png (boot/loading)
const LOGO_WIDTH_RATIO = 0.32; // lebar watermark relatif ke lebar foto
const LOGO_OPACITY = 0.55;
/** Batas sisi terpanjang canvas -- canvas raksasa (foto kamera HP 12-50 MP) gagal diam-diam di browser mobile. */
const MAX_CANVAS_SIDE = 2048;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar: ${src.slice(0, 40)}`));
    img.src = src;
  });
}

type Drawable = ImageBitmap | HTMLImageElement;

function sizeOf(source: Drawable): { width: number; height: number } {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

/** Decode foto dari Blob -- createImageBitmap dulu (hemat memori, hormati EXIF), fallback ke <img>. */
async function decodePhoto(blob: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // lanjut ke fallback <img>
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Logo di-fetch lewat network lalu di-decode (1x retry) -- koneksi HP bisa gagal sekali. */
async function loadLogo(): Promise<Drawable> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(LOGO_SRC, { cache: "force-cache" });
      if (!res.ok) throw new Error(`Logo HTTP ${res.status}`);
      return await decodePhoto(await res.blob());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Logo gagal dimuat");
}

/**
 * Taruh logo Yohan.AI (versi header, logo-dark.png) di tengah foto, semi-transparan
 * dengan shadow supaya tetap kebaca di foto terang maupun gelap. Dipanggil setelah
 * kompresi (browser-image-compression), sebelum upload ke Storage.
 *
 * MELEMPAR error kalau gagal (canvas tak didukung, toBlob kosong, logo gagal dimuat) --
 * pemanggil (uploadListingPhoto) yang memutuskan fallback DAN memberi tahu pengguna,
 * supaya foto tanpa watermark tidak lolos diam-diam.
 */
export async function watermarkPhoto(file: Blob, mimeType: string): Promise<Blob> {
  const [photo, logo] = await Promise.all([decodePhoto(file), loadLogo()]);

  const { width, height } = sizeOf(photo);
  const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(width, height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung browser ini");

  ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

  const logoSize = sizeOf(logo);
  const logoWidth = canvas.width * LOGO_WIDTH_RATIO;
  const logoHeight = logoWidth * (logoSize.height / logoSize.width);

  ctx.save();
  ctx.globalAlpha = LOGO_OPACITY;
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 12;
  ctx.drawImage(
    logo,
    (canvas.width - logoWidth) / 2,
    (canvas.height - logoHeight) / 2,
    logoWidth,
    logoHeight
  );
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas gagal menghasilkan gambar (memori HP?)"))),
      mimeType || "image/jpeg",
      0.9
    );
  });
}
