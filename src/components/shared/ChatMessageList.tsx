"use client";

// src/components/shared/ChatMessageList.tsx

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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

const MEDIA_NOTICE = "📎 Lampiran (foto/video/dokumen) -- buka WhatsApp untuk melihat.";

/** Konversi baris chat.messages mentah (metadata JSONB) jadi ChatMessage siap-render. */
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

interface ChatMessageListProps {
  messages: ChatMessage[];
  emptyLabel: string;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Bubble list dipakai bareng oleh Lead Detail dan Recent Chats (dashboard). */
export function ChatMessageList({ messages, emptyLabel }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLLIElement>(null);

  // Scroll ke pesan terbaru tiap kali jumlah pesan berubah (pesan baru dari
  // Realtime atau kirim manual) -- WA di HP auto-scroll, di sini dulu tidak.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="flex max-h-96 flex-col gap-3 overflow-y-auto">
      {messages.map((m) => (
        <li
          key={m.id}
          className={cn(
            "w-fit max-w-[80%] rounded-lg px-3 py-2 text-sm",
            m.sender_type === "customer" ? "self-start bg-muted" : "self-end bg-brand/10"
          )}
        >
          {m.message_type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL R2 eksternal, bukan aset Next.js
            <img src={m.content} alt="Foto listing" className="max-w-full rounded-md" />
          ) : (
            <p className={cn("whitespace-pre-wrap", m.has_media && "italic text-muted-foreground")}>
              {m.has_media ? MEDIA_NOTICE : m.content}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(m.created_at)}</p>
        </li>
      ))}
      <li ref={bottomRef} aria-hidden className="h-px" />
    </ul>
  );
}
