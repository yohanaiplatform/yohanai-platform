// src/components/shared/ChatMessageList.tsx

import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
  /** true kalau pesan aslinya media (foto/video/dokumen) -- konten mentahnya (link storage Kapso) sengaja tidak ditampilkan. */
  has_media?: boolean;
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
  const metadata = row.metadata;
  const hasMedia = Boolean(
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>).has_media
      : false
  );

  return {
    id: row.id,
    sender_type: row.sender_type,
    content: row.content,
    created_at: row.created_at,
    has_media: hasMedia,
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
          <p className={cn("whitespace-pre-wrap", m.has_media && "italic text-muted-foreground")}>
            {m.has_media ? MEDIA_NOTICE : m.content}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(m.created_at)}</p>
        </li>
      ))}
    </ul>
  );
}
