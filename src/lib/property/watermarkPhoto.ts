// src/lib/property/watermarkPhoto.ts

const LOGO_SRC = "/images/logo/logo-dark.png"; // versi teks putih -- header, BUKAN app-icon.png (boot/loading)
const LOGO_WIDTH_RATIO = 0.32; // lebar watermark relatif ke lebar foto
const LOGO_OPACITY = 0.55;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return loadImage(url).finally(() => URL.revokeObjectURL(url));
}

/**
 * Taruh logo Yohan.AI (versi header, logo-dark.png) di tengah foto, semi-transparan
 * dengan shadow supaya tetap kebaca di foto terang maupun gelap. Dipanggil setelah
 * kompresi (browser-image-compression), sebelum upload ke Storage.
 */
export async function watermarkPhoto(file: Blob, mimeType: string): Promise<Blob> {
  const [photo, logo] = await Promise.all([loadImageFromBlob(file), loadImage(LOGO_SRC)]);

  const canvas = document.createElement("canvas");
  canvas.width = photo.naturalWidth;
  canvas.height = photo.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // browser tak dukung canvas -- upload foto asli tanpa watermark daripada gagal total

  ctx.drawImage(photo, 0, 0);

  const logoWidth = canvas.width * LOGO_WIDTH_RATIO;
  const logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth);

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

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob || file),
      mimeType || "image/jpeg",
      0.9
    );
  });
}
