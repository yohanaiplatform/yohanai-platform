// src/components/shared/ChatMessageList.tsx

import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
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
          <p className="whitespace-pre-wrap">{m.content}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(m.created_at)}</p>
        </li>
      ))}
    </ul>
  );
}
