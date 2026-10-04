"use client";

// src/components/settings/KnowledgeGapsManager.tsx

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface GapRow {
  id: string;
  topic: string;
  sample_questions: string[];
  occurrence_count: number;
  suggested_keywords: string[];
}

/**
 * Knowledge Loop -- daftar topik yang sering membuat AI mentok (dibuat harian dari catatan
 * "AI butuh follow-up"). Jawaban yang Anda tulis langsung jadi pengetahuan AI.
 */
export function KnowledgeGapsManager() {
  const [gaps, setGaps] = useState<GapRow[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [keywords, setKeywords] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCurator, setIsCurator] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .schema("knowledge")
      .from("gaps")
      .select("id, topic, sample_questions, occurrence_count, suggested_keywords")
      .eq("status", "open")
      .order("occurrence_count", { ascending: false });
    const rows = (data ?? []) as GapRow[];
    setGaps(rows);
    setKeywords((prev) => {
      const next = { ...prev };
      for (const row of rows) if (next[row.id] === undefined) next[row.id] = row.suggested_keywords.join(", ");
      return next;
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.schema("auth_ext").from("profiles").select("is_knowledge_curator").eq("user_id", user.id).maybeSingle();
      setIsCurator(data?.is_knowledge_curator === true);
    })();
  }, [load]);

  async function resolve(gap: GapRow, action: "answer" | "dismiss") {
    setError(null);
    setNotice(null);
    if (action === "dismiss" && !window.confirm(`Abaikan topik "${gap.topic}"? Topik ini tidak akan muncul lagi.`)) return;

    setBusyId(gap.id);
    const res = await fetch("/api/knowledge/gaps/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gapId: gap.id,
        action,
        answer: answers[gap.id],
        keywords: (keywords[gap.id] ?? "").split(",").map((k) => k.trim()).filter(Boolean),
      }),
    });
    setBusyId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Gagal memproses topik.");
      return;
    }
    const result = await res.json().catch(() => null);
    if (result?.pending) setNotice("Terkirim -- menunggu persetujuan kurator sebelum dipakai asisten. Terima kasih sudah menambah pengetahuan!");
    await load();
  }

  if (gaps === null) return <p className="text-sm text-muted-foreground">Memuat...</p>;

  if (gaps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada topik. Setiap pagi (06.00 WIB) sistem merangkum hal-hal yang sering membuat asisten mentok dan
        menampilkannya di sini untuk Anda jawab.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {notice && <p className="text-sm text-green-600">{notice}</p>}
      {gaps.map((gap) => (
        <div key={gap.id} className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="text-sm font-medium">{gap.topic}</div>
            <span className="text-xs text-muted-foreground">Muncul {gap.occurrence_count}x</span>
          </div>
          {gap.sample_questions.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {gap.sample_questions.map((q) => (
                <li key={q}>&ldquo;{q}&rdquo;</li>
              ))}
            </ul>
          )}
          <Textarea
            rows={3}
            placeholder="Tulis jawaban yang benar (fakta, singkat). Akan dipakai asisten untuk menjawab konsumen."
            value={answers[gap.id] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [gap.id]: e.target.value }))}
          />
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Kata kunci pemicu (pisahkan dengan koma)</div>
            <Input
              value={keywords[gap.id] ?? ""}
              onChange={(e) => setKeywords((prev) => ({ ...prev, [gap.id]: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busyId === gap.id || (answers[gap.id] ?? "").trim().length < 10}
              onClick={() => resolve(gap, "answer")}
            >
              {busyId === gap.id ? "Menyimpan..." : isCurator ? "Simpan sebagai pengetahuan" : "Usulkan jawaban"}
            </Button>
            {isCurator && (
              <Button type="button" size="sm" variant="outline" disabled={busyId === gap.id} onClick={() => resolve(gap, "dismiss")}>
                Abaikan
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
