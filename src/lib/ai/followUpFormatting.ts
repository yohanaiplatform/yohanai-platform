// src/lib/ai/followUpFormatting.ts

/**
 * Format gabungan beberapa follow-up note (dari ai.follow_up_queue, 1 lead
 * yang sempat beberapa kali mentok dalam 1 sesi chat) jadi SATU teks
 * ringkas -- dipakai untuk body notifikasi in-app (dirender NotificationMenu
 * lewat renderLightMarkdown()) MAUPUN pesan WhatsApp ke nomor notifikasi
 * personal agent (lihat flush-follow-ups/route.ts).
 *
 * Sengaja pakai format WhatsApp (*bold* -- satu bintang, bukan **bold**)
 * sebagai SATU sumber -- WhatsApp cuma dukung subset kecil ini, dan
 * NotificationMenu.tsx ditulis untuk mengerti syntax yang sama supaya
 * tidak perlu 2 versi teks terpisah.
 */
const MAX_NOTES = 3;
const NOTE_MAX_CHARS = 110;

function shorten(text: string): string {
  const clean = text.replace(/s+/g, " ").trim();
  return clean.length > NOTE_MAX_CHARS ? `${clean.slice(0, NOTE_MAX_CHARS - 1).trimEnd()}…` : clean;
}

export function formatFollowUpSummary(leadName: string, notes: string[], leadUrl: string): string {
  // Brief info saja: maks 3 catatan TERBARU (yang lama biasanya sudah usang), tiap catatan dipendekkan --
  // isi chat selengkapnya bisa dibaca di Lead Detail.
  const allUnique = Array.from(new Set(notes.map((n) => n.trim()).filter(Boolean)));
  const uniqueNotes = allUnique.slice(-MAX_NOTES).map(shorten);
  const omitted = allUnique.length - uniqueNotes.length;

  const lines = [
    `*Follow-up dibutuhkan: ${leadName}*`,
    "",
    ...uniqueNotes.map((note) => `- ${note}`),
    ...(omitted > 0 ? [`(+${omitted} catatan lain, lihat chat)`] : []),
    "",
    leadUrl,
  ];

  return lines.join("\n");
}
