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
export function formatFollowUpSummary(leadName: string, notes: string[], leadUrl: string): string {
  const uniqueNotes = Array.from(new Set(notes.map((n) => n.trim()).filter(Boolean)));

  const lines = [
    `*Follow-up dibutuhkan: ${leadName}*`,
    "",
    ...uniqueNotes.map((note) => `- ${note}`),
    "",
    leadUrl,
  ];

  return lines.join("\n");
}
