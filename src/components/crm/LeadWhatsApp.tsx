"use client";

// src/components/crm/LeadWhatsApp.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LeadChatMessage } from "@/lib/crm/getLeadConversation";
import type { CrmDictionary } from "@/lib/i18n/dictionaries";

interface LeadWhatsAppProps {
  leadId: string;
  messages: LeadChatMessage[];
  t: CrmDictionary;
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

export function LeadWhatsApp({ leadId, messages, t }: LeadWhatsAppProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    setError(null);

    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, message: text.trim() }),
    });

    setSending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? t.detail.whatsappSendError);
      return;
    }

    setText("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.detail.whatsappEmpty}</p>
      ) : (
        <ul className="flex max-h-96 flex-col gap-3 overflow-y-auto">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "w-fit max-w-[80%] rounded-lg px-3 py-2 text-sm",
                m.sender_type === "customer"
                  ? "self-start bg-muted"
                  : "self-end bg-brand/10"
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(m.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2 border-t border-border pt-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.detail.whatsappPlaceholder}
          rows={2}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={sending || !text.trim()}>
            {sending ? t.detail.whatsappSending : t.detail.whatsappSend}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </form>
    </div>
  );
}
