// src/lib/chat/toChatMessage.ts

export interface ChatMessage {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
  /** true kalau pesan aslinya media (foto/video/dokumen) DARI LEAD -- konten mentahnya (link storage Kapso) sengaja tidak ditampilkan. */
  has_media?: boolean;
  /** "image" kalau ini pesan foto YANG DIKIRIM AI Agent (content = URL R2 publik, aman ditampilkan langsung). */
  message_type?: string;
}

/**
 * Konversi baris chat.messages mentah (metadata JSONB) jadi ChatMessage siap-render.
 *
 * Sengaja di file TANPA "use client" -- dipakai dari server (getLeadConversation.ts)
 * MAUPUN client (RecentChatThread.tsx, LeadWhatsApp.tsx). Fungsi plain (bukan
 * komponen) yang diekspor dari file "use client" tidak bisa dipanggil langsung
 * dari server code di Next.js App Router -- pernah bikin /crm/[id] 500 untuk
 * lead yang punya percakapan WA ("Attempted to call toChatMessage() from the
 * server but toChatMessage is on the client"), baru ketahuan 2 Oktober 2026.
 */
export function toChatMessage(row: {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
  metadata?: unknown;
}): ChatMessage {
  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    sender_type: row.sender_type,
    content: row.content,
    created_at: row.created_at,
    has_media: Boolean(metadata.has_media),
    message_type: typeof metadata.message_type === "string" ? metadata.message_type : undefined,
  };
}
