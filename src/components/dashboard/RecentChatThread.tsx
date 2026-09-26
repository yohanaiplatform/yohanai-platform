"use client";

// src/components/dashboard/RecentChatThread.tsx

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessageList, type ChatMessage } from "@/components/shared/ChatMessageList";

interface RecentChatThreadProps {
  conversationId: string;
  leadId: string | null;
}

/** Thread inline dipakai saat 1 baris Recent Chats diklik -- live lewat Supabase Realtime. */
export function RecentChatThread({ conversationId, leadId }: RecentChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function appendMessage(message: ChatMessage) {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }

  useEffect(() => {
    let active = true;

    const supabase = createClient();
    supabase
      .schema("chat")
      .from("messages")
      .select("id, sender_type, content, created_at")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setMessages(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`recent-chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "chat",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => appendMessage(payload.new as ChatMessage)
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !leadId) return;

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
      setError(body?.error ?? "Failed to send message. Please try again.");
      return;
    }

    const result = await res.json();
    if (result.message) appendMessage(result.message);
    setText("");
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <ChatMessageList messages={messages} emptyLabel="No messages yet." />
      )}

      {leadId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a reply..."
            rows={2}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={sending || !text.trim()}>
              {sending ? "Sending..." : "Send WhatsApp"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          Not linked to a lead -- view only.
        </p>
      )}
    </div>
  );
}
