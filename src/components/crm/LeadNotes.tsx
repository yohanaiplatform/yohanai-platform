"use client";

// src/components/crm/LeadNotes.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LeadNote } from "@/lib/crm/getLeadNotes";
import type { CrmDictionary } from "@/lib/i18n/dictionaries";

interface LeadNotesProps {
  leadId: string;
  notes: LeadNote[];
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

/**
 * Riwayat catatan per lead, append-only -- beda dari field terstruktur
 * (Kategori/Temperature/dll di LeadEditableFields) yang cuma menyimpan
 * nilai TERKINI. Di sini tiap update jadi baris baru dengan waktu,
 * bukan overwrite -- supaya "Lead sudah dapat unit lain", "Lead batal
 * booking", dst tercatat sebagai jejak, bukan hilang begitu diganti lagi.
 */
export function LeadNotes({ leadId, notes, t }: LeadNotesProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .schema("auth_ext")
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", userData.user?.id ?? "")
      .maybeSingle();

    const authorLabel =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      userData.user?.email ||
      t.detail.teamFallback;

    const { error: insertError } = await supabase
      .schema("customer")
      .from("notes")
      .insert({
        lead_id: leadId,
        note: text.trim(),
        author_label: authorLabel,
        created_by: userData.user?.id ?? null,
      });

    setSubmitting(false);

    if (insertError) {
      setError(t.detail.noteError);
      return;
    }

    setText("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.detail.notePlaceholder}
          rows={2}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={submitting || !text.trim()}>
            {submitting ? t.detail.addingNote : t.detail.addNote}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.detail.noNotes}</p>
      ) : (
        <ul className="space-y-3 border-t border-border pt-3">
          {notes.map((n) => (
            <li key={n.id} className="text-sm">
              <p className="whitespace-pre-wrap">{n.note}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {n.author_label} &middot; {formatDateTime(n.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
