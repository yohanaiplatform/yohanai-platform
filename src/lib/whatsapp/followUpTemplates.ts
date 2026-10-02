// src/lib/whatsapp/followUpTemplates.ts

/**
 * Template follow-up WhatsApp yang sudah disetujui Meta (tanpa variabel).
 * File polos (tanpa "use client") -- dipakai route server DAN komponen client.
 * Tambah template baru di sini SETELAH statusnya Approved di Kapso/Meta.
 */
export const FOLLOW_UP_TEMPLATES = [
  { name: "yohan_griya", language: "id", label: "Follow-up umum (yohan_griya)" },
  { name: "follow_up_kapur_mas_t2", language: "id", label: "Kapur Mas Tahap 2 (follow_up_kapur_mas_t2)" },
] as const;

export const DEFAULT_FOLLOW_UP_TEMPLATE = FOLLOW_UP_TEMPLATES[0].name;
