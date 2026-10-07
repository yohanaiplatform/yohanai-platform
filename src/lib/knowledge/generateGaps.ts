// src/lib/knowledge/generateGaps.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const LOOKBACK_DAYS = 7;
const MIN_NOTES = 3;
const MAX_NOTES_SENT = 150;
const MAX_TOPICS = 8;

const SYSTEM_PROMPT = `Anda menganalisis catatan "AI mentok" dari asisten WhatsApp agen properti Griya Indonesia. Tiap catatan adalah satu hal yang tidak bisa dijawab asisten karena datanya belum ada.

Tugas: kelompokkan catatan yang membahas hal SAMA menjadi topik pengetahuan yang bisa dijawab bisnis dengan fakta (mis. "Apakah Kapur Mas Tahap 2 pakai one gate system?", "Berapa biaya BPHTB & AJB?").

ATURAN:
- HANYA topik yang berupa FAKTA/pengetahuan yang bisa ditulis sekali lalu dipakai ulang. ABAIKAN permintaan yang butuh tindakan manusia (atur jadwal survey, nego harga, kirim lokasi/pin Maps, kirim foto, booking, hubungi lead).
- topic: 1 kalimat tanya singkat (maks 90 karakter), Bahasa Indonesia.
- count: berapa catatan yang masuk topik itu.
- samples: maks 3 kutipan singkat dari catatan asli (maks 100 karakter tiap kutipan).
- keywords: 3-6 kata/frasa huruf kecil yang kemungkinan dipakai calon pembeli saat menanyakan hal itu.
- Jangan ulang topik yang sudah ada di "Topik yang sudah ada". Maksimal ${MAX_TOPICS} topik, urut dari count terbanyak. Kalau tidak ada topik yang layak, kembalikan [].
- Balas HANYA JSON valid berupa array: [{"topic": string, "count": number, "samples": string[], "keywords": string[]}]`;

interface GapDraft {
  topic: string;
  count: number;
  samples: string[];
  keywords: string[];
}

function isGapDraft(value: unknown): value is GapDraft {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.topic === "string" &&
    typeof v.count === "number" &&
    Array.isArray(v.samples) &&
    v.samples.every((s) => typeof s === "string") &&
    Array.isArray(v.keywords) &&
    v.keywords.every((k) => typeof k === "string")
  );
}

export interface GenerateGapsResult {
  created: number;
  skippedReason?: string;
}

/**
 * Knowledge Loop langkah 2: kelompokkan catatan "AI mentok" 7 hari terakhir jadi topik celah
 * pengetahuan baru. AI HANYA mengusulkan topik (pertanyaan); jawabannya wajib ditulis manusia
 * di Settings -> "Celah Pengetahuan AI" sebelum jadi entri knowledge.entries.
 */
export async function generateKnowledgeGaps(supabase: SupabaseClient<Database>): Promise<GenerateGapsResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { created: 0, skippedReason: "ANTHROPIC_API_KEY belum dikonfigurasi" };

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 3600 * 1000).toISOString();

  const [{ data: queue }, { data: existing }] = await Promise.all([
    supabase.schema("ai").from("follow_up_queue").select("note").gte("created_at", since).order("created_at", { ascending: false }).limit(MAX_NOTES_SENT),
    supabase.schema("knowledge").from("gaps").select("topic, status").in("status", ["open", "answered"]),
  ]);

  const notes = Array.from(new Set((queue ?? []).map((q) => q.note.trim()).filter(Boolean)));
  if (notes.length < MIN_NOTES) return { created: 0, skippedReason: "catatan belum cukup" };

  const existingTopics = (existing ?? []).map((g) => g.topic);
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Topik yang sudah ada:\n${existingTopics.length ? existingTopics.map((t) => `- ${t}`).join("\n") : "(belum ada)"}\n\nCatatan AI mentok (${notes.length}):\n${notes.map((n) => `- ${n}`).join("\n")}`,
        },
      ],
      output_config: { effort: process.env.ANTHROPIC_EFFORT || "low" },
    }),
  });

  if (!res.ok) return { created: 0, skippedReason: `Anthropic API ${res.status}` };

  const json = await res.json();
  await supabase
    .schema("ai")
    .from("llm_usage")
    .insert({
      feature: "knowledge_gaps",
      model,
      input_tokens: json.usage?.input_tokens ?? 0,
      output_tokens: json.usage?.output_tokens ?? 0,
    });
  const text: string = json.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return { created: 0, skippedReason: "respons AI bukan JSON array" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(arrayMatch[0]);
  } catch {
    return { created: 0, skippedReason: "JSON tidak valid" };
  }
  if (!Array.isArray(parsed)) return { created: 0, skippedReason: "format tidak sesuai" };

  const known = new Set(existingTopics.map((t) => t.toLowerCase().trim()));
  const rows = parsed
    .filter(isGapDraft)
    .filter((g) => g.topic.trim() && !known.has(g.topic.toLowerCase().trim()))
    .slice(0, MAX_TOPICS)
    .map((g) => ({
      topic: g.topic.trim().slice(0, 200),
      occurrence_count: Math.max(1, Math.round(g.count)),
      sample_questions: g.samples.slice(0, 3).map((s) => s.slice(0, 200)),
      suggested_keywords: g.keywords.slice(0, 6).map((k) => k.toLowerCase().trim()).filter(Boolean),
    }));

  if (rows.length === 0) return { created: 0, skippedReason: "tidak ada topik baru" };

  const { error } = await supabase.schema("knowledge").from("gaps").insert(rows);
  if (error) return { created: 0, skippedReason: `gagal simpan: ${error.message}` };

  return { created: rows.length };
}
