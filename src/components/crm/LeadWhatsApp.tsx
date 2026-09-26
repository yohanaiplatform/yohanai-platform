"use client";

// src/components/crm/LeadWhatsApp.tsx

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessageList, type ChatMessage } from "@/components/shared/ChatMessageList";
import type { CrmDictionary } from "@/lib/i18n/dictionaries";

interface LeadWhatsAppProps {
  leadId: string;
  conversationId: string | null;
  messages: ChatMessage[];
  t: CrmDictionary;
}

/** Percakapan WhatsApp per lead -- live lewat Supabase Realtime, bukan cuma render sekali di server. */
export function LeadWhatsApp({
  leadId,
  conversationId: initialConversationId,
  messages: initialMessages,
  t,
}: LeadWhatsAppProps) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function appendMessage(message: ChatMessage) {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }

  // Lead yang belum pernah chat sama sekali belum punya conversation --
  // dengarkan sampai webhook/pengiriman pertama membuatnya.
  useEffect(() => {
    if (conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`lead-conversation-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "chat",
          table: "conversations",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => setConversationId(payload.new.id as string)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "chat",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          appendMessage(row);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

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

    const result = await res.json();
    if (result.conversationId && !conversationId) setConversationId(result.conversationId);
    if (result.message) appendMessage(result.message);
    setText("");
  }

  return (
    <div className="space-y-4">
      <ChatMessageList messages={messages} emptyLabel={t.detail.whatsappEmpty} />

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
