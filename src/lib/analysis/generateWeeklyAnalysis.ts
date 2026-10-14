// src/lib/analysis/generateWeeklyAnalysis.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { computeAnalysisData } from "@/lib/analysis/computeMetrics";
import { sendAnalysisEmail } from "@/lib/analysis/sendAnalysisEmail";
import type { AnalysisFinding, AnalysisMetrics } from "@/lib/analysis/types";

const MAX_FINDINGS = 5;
/** Periode analisis = jarak antar laporan otomatis (hari). */
const PERIOD_DAYS = 3;
/** Laporan otomatis dianggap jatuh tempo bila yang terakhir lebih tua dari ini (sedikit di bawah 3 hari agar jam 07 WIB tidak meleset sehari). */
const DUE_AFTER_HOURS = 70;

const SYSTEM_PROMPT = `Anda adalah analis data untuk platform CRM properti Yohan.AI (bisnis agen properti Pontianak). Anda menerima ANGKA AGREGAT berkala (periode = metrics.days hari terakhir, saat ini 3 hari) yang sudah dihitung kode: sebaran Temperature lead (Cold/Warm/Hot/Closing/Batal), perpindahan Temperature, kualitas per sumber lead, "topics" (topik yang ditanyakan calon pembeli dibandingkan dengan proporsi lead yang mencapai Hot/Closing/Booking), "objections", "demand", "reasons", dan kinerja asisten AI WhatsApp.

Tugas: tulis temuan terpenting minggu ini untuk pemilik bisnis.

ATURAN KETAT:
- Pakai HANYA angka yang ada di data. DILARANG menghitung ulang, memperkirakan, atau mengarang angka, nama, atau penyebab.
- Setiap temuan menyebut jumlah sampelnya. Sumber dengan "enough": false atau sampel kecil: tulis "belum cukup data untuk disimpulkan", jangan dibandingkan sebagai fakta.
- Untuk "topics": ini KORELASI, bukan sebab-akibat; "survey" sengaja tidak dihitung karena itu penentu definisi Hot. Bandingkan hanya baris dengan "enough": true, selalu sebut jumlah lead (mis. 6 dari 38 vs 2 dari 75) dan bahwa jumlah lead Hot (topics.hotLeads) masih kecil sehingga selisih bisa kebetulan. "beforeHot" = topik sebelum naik Hot, sampel sangat kecil: sebut sebagai petunjuk awal saja.
KAMUS FIELD (baca sebelum menulis; salah menafsirkan = menyesatkan pemilik):
- funnel.current = kondisi SEMUA lead SAAT INI (bukan perubahan periode ini). Jangan menulis "periode ini ada 422 lead Hot". Yang terjadi dalam periode hanya funnel.transitions (perpindahan Temperature dalam metrics.days hari terakhir). Jangan menyebut "minggu ini"/"7 hari": sebut "periode ini" atau "N hari terakhir" sesuai metrics.days.
- funnel.hotWarmWithChat = lead Hot/Warm yang punya percakapan WhatsApp. stalledHotWarm = dari mereka, yang TIDAK ada pesan sama sekali lebih dari 5 hari (tulis "sepi lebih dari 5 hari", bukan "macet"/"stalled"). ai.unansweredHotWarm = lead yang pesan terakhirnya dari calon pembeli dan belum dibalas lebih dari 2 jam (tulis "menunggu balasan", bukan "belum dibalas sama sekali").
- funnel.medianHoursToHot dihitung dari funnel.hotSample lead saja (sangat kecil); sebut sampelnya atau abaikan.
- Sebagian besar dari ±2.000 lead adalah data lama hasil migrasi tanpa percakapan di platform; topics hanya mencakup lead yang pernah chat (topics.leadsAnalyzed), jadi jangan menyamakan jumlah lead Hot di funnel dengan di topics.
- sources: Temperature adalah kondisi saat ini. Lead dari iklan yang baru berjalan belum sempat "matang", jadi proporsi Hot yang rendah pada sumber baru belum tentu berarti iklannya buruk; katakan itu bila sumber terbesar terlihat rendah.
- objections = keberatan yang diucapkan calon pembeli (pencocokan kata kunci; jumlahnya kecil dan bisa meleset). rows[].leads = lead yang pernah menyatakannya, recent7d = dalam periode analisis (metrics.days hari terakhir), nowHot/nowColdBatal = kondisi mereka sekarang, stoppedAfter = lead yang pesan terakhirnya keberatan itu lalu sepi >5 hari dan belum Hot. Ini hitungan deskriptif, bukan perbandingan: sebut jumlah lead, jangan menyimpulkan penyebab, dan jika totalnya kecil katakan "baru sedikit contoh". Jangan menyebut nama atau mengutip pesan lead.
- demand = permintaan lokasi/proyek vs stok listing. rows[].leads = lead yang pernah menyebut area itu (seluruh riwayat), leads30 = yang dibuat 30 hari terakhir, hotWarm = yang kini Hot/Warm, stock = listing TERSEDIA di area itu (menghitung semua jenis listing: rumah baru, seken, tanah, jadi kasar). gap = permintaan 30 hari >= minDemandForGap tetapi stok 0 (mendesak); historicGap = stok 0 tetapi permintaan lama banyak (mungkin proyek sudah habis atau pernah laku). Stok banyak tetapi leads30 sangat kecil = stok tanpa peminat. unmapped = istilah minat yang belum terpetakan (mis. kode blok B10), sebut hanya bila jumlahnya besar. Jangan menyimpulkan penyebab; beri saran seperti "pertimbangkan mencari listing di area X".
- reasons = alasan Batal/Closing yang DICATAT AGEN (fakta, beda dari keberatan hasil tebakan kata kunci). batalWithReason/batalTotal adalah kelengkapan: bila kecil, katakan alasan baru mulai dicatat dan jangan menarik kesimpulan; bila sudah banyak, sebut alasan terbanyak dengan jumlahnya.
- Hindari istilah Inggris dan nama field teknis di teks temuan.
- Jangan membuat temuan sepele (mis. "ada 12 lead belum dinilai") bila ada hal yang lebih penting; utamakan yang bisa langsung ditindaklanjuti.

- Jujur soal keterbatasan: riwayat Temperature baru terkumpul sejak 4 Oktober 2026, percakapan WhatsApp sejak 26 September 2026. Hindari kata "prediksi"; ini analisis deskriptif (apa yang terjadi).
- Hanya saran tindakan yang realistis dan langsung terkait angka (mis. tindak lanjuti lead Hot yang belum dibalas). Jangan menyarankan menaikkan budget iklan atau top-up.
- Bahasa Indonesia, singkat, jelas, tanpa istilah teknis database. Maksimal ${MAX_FINDINGS} temuan, urut dari yang paling penting.
- Balas HANYA JSON valid: {"headline": string (SATU kalimat pendek, maks 90 karakter), "findings": [{"title": string (maks 80), "detail": string (maks 280), "action": string|null (maks 160)}]}`;

function isFinding(value: unknown): value is AnalysisFinding {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string" && typeof v.detail === "string" && (v.action === null || v.action === undefined || typeof v.action === "string");
}

interface Narrative {
  headline: string;
  findings: AnalysisFinding[];
}

async function writeNarrative(admin: SupabaseClient<Database>, metrics: AnalysisMetrics): Promise<Narrative | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Data periode (JSON):\n${JSON.stringify(metrics)}` }],
      output_config: { effort: process.env.ANTHROPIC_EFFORT || "low" },
    }),
  });
  if (!res.ok) return null;

  const json = await res.json();
  await admin
    .schema("ai")
    .from("llm_usage")
    .insert({
      feature: "analysis_weekly",
      model,
      input_tokens: json.usage?.input_tokens ?? 0,
      output_tokens: json.usage?.output_tokens ?? 0,
    });

  const text: string = json.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (!objectMatch) return null;
  try {
    const parsed = JSON.parse(objectMatch[0]) as { headline?: unknown; findings?: unknown };
    if (typeof parsed.headline !== "string" || !Array.isArray(parsed.findings)) return null;
    const findings = parsed.findings
      .filter(isFinding)
      .slice(0, MAX_FINDINGS)
      .map((f) => ({ title: f.title.slice(0, 120), detail: f.detail.slice(0, 400), action: f.action ? f.action.slice(0, 220) : null }));
    return { headline: parsed.headline.slice(0, 200), findings };
  } catch {
    return null;
  }
}

function wibDate(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(date);
}

export interface WeeklyAnalysisResult {
  status: "created" | "exists" | "failed";
  periodEnd?: string;
  narrative?: boolean;
  emailed?: boolean;
  error?: string;
}

/**
 * Data Analysis Agent v1: hitung angka (kode) -> ringkas (AI) -> simpan ke ai.analysis_reports -> kirim email.
 * HANYA membaca data lain; tidak mengubah lead dan tidak mengirim pesan ke calon pembeli. Idempoten per tanggal WIB
 * (kind + period_end unik) dan hanya bila laporan terakhir sudah lebih dari ~3 hari (kecuali force=true). Nilai kolom kind tetap "weekly" (nama lama, tidak diubah agar tanpa migration). Penerima email: ANALYSIS_REPORT_RECIPIENT, jika kosong PLATFORM_REPORT_RECIPIENT
 * (pemilik saja; tidak otomatis ke akun lain).
 */
export async function generateWeeklyAnalysis(
  admin: SupabaseClient<Database>,
  options: { force?: boolean } = {}
): Promise<WeeklyAnalysisResult> {
  const now = new Date();
  const periodEnd = wibDate(now);
  const periodStart = wibDate(new Date(now.getTime() - PERIOD_DAYS * 24 * 3600 * 1000));

  if (!options.force) {
    // Otomatis tiap 3 hari (PERIOD_DAYS): lewati bila laporan terakhir (otomatis maupun manual) belum cukup lama.
    const { data: latest } = await admin
      .schema("ai")
      .from("analysis_reports")
      .select("created_at")
      .eq("kind", "weekly")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest && now.getTime() - new Date(latest.created_at).getTime() < DUE_AFTER_HOURS * 3600 * 1000) return { status: "exists", periodEnd };
  }

  try {
    // followUps memuat nama lead: disimpan dan diemailkan, TIDAK dikirim ke LLM (hanya `metrics` yang dikirim).
    const { metrics, followUps } = await computeAnalysisData(admin, PERIOD_DAYS, now);
    const narrative = await writeNarrative(admin, metrics);

    const row = {
      kind: "weekly",
      period_start: periodStart,
      period_end: periodEnd,
      metrics: metrics as unknown as Json,
      headline: narrative?.headline ?? null,
      findings: (narrative?.findings ?? []) as unknown as Json,
      followups: followUps as unknown as Json,
      emailed_at: null as string | null,
    };
    const { error } = await admin.schema("ai").from("analysis_reports").upsert(row, { onConflict: "kind,period_end" });
    if (error) return { status: "failed", periodEnd, error: error.message };

    const recipient = (process.env.ANALYSIS_REPORT_RECIPIENT || process.env.PLATFORM_REPORT_RECIPIENT || "").trim();
    let emailed = false;
    if (recipient) {
      const sent = await sendAnalysisEmail(recipient, { periodStart, periodEnd, metrics, headline: narrative?.headline ?? null, findings: narrative?.findings ?? [], followUps });
      emailed = !sent.error;
      if (emailed) {
        await admin.schema("ai").from("analysis_reports").update({ emailed_at: new Date().toISOString() }).eq("kind", "weekly").eq("period_end", periodEnd);
      }
    }
    return { status: "created", periodEnd, narrative: Boolean(narrative), emailed };
  } catch (error) {
    return { status: "failed", periodEnd, error: error instanceof Error ? error.message : "gagal" };
  }
}
