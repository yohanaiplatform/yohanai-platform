// src/lib/property/exportFlyer.ts

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

async function captureFlyer(elementId: string): Promise<HTMLCanvasElement> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Elemen flyer #${elementId} tidak ditemukan`);

  return html2canvas(element, { useCORS: true, scale: 1 });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function exportFlyerAsJpg(elementId: string, filename: string) {
  const canvas = await captureFlyer(elementId);
  downloadDataUrl(canvas.toDataURL("image/jpeg", 0.92), filename);
}

export async function exportFlyerAsPdf(elementId: string, filename: string) {
  const canvas = await captureFlyer(elementId);
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  // mm, mengikuti rasio kanvas asli (1080x1350) supaya tidak terdistorsi.
  const widthMm = 210;
  const heightMm = (canvas.height / canvas.width) * widthMm;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
  });
  pdf.addImage(imgData, "JPEG", 0, 0, widthMm, heightMm);
  pdf.save(filename);
}
