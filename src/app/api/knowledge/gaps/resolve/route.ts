// src/app/api/knowledge/gaps/resolve/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Jawab atau abaikan satu celah pengetahuan AI (Knowledge Loop). Diamankan sesi login.
 * "answer": jawaban manusia disimpan sebagai entri knowledge.entries baru (aktif langsung --
 * AI memakainya di pesan berikutnya) dan celah ditandai terjawab. Penulisan pakai service_role
 * setelah sesi diverifikasi (tabel knowledge tidak ditulis langsung dari browser).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { gapId?: string; action?: string; answer?: string; keywords?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { gapId, action } = body;
  if (!gapId || (action !== "answer" && action !== "dismiss")) {
    return NextResponse.json({ error: "gapId dan action (answer|dismiss) wajib diisi" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: gap } = await admin.schema("knowledge").from("gaps").select("id, topic, status").eq("id", gapId).maybeSingle();
  if (!gap) return NextResponse.json({ error: "Celah tidak ditemukan" }, { status: 404 });
  if (gap.status !== "open") return NextResponse.json({ error: "Celah sudah diproses" }, { status: 409 });

  const now = new Date().toISOString();

  if (action === "dismiss") {
    await admin.schema("knowledge").from("gaps").update({ status: "dismissed", resolved_at: now, resolved_by: user.id }).eq("id", gapId);
    return NextResponse.json({ success: true });
  }

  const answer = body.answer?.trim();
  if (!answer || answer.length < 10) {
    return NextResponse.json({ error: "Jawaban minimal 10 karakter" }, { status: 400 });
  }
  const keywords = (body.keywords ?? []).map((k) => k.toLowerCase().trim()).filter(Boolean).slice(0, 10);

  const { data: entry, error: entryError } = await admin
    .schema("knowledge")
    .from("entries")
    .insert({
      title: gap.topic,
      content: `Pertanyaan: ${gap.topic}\nJawaban: ${answer}`,
      keywords,
      related_listing_terms: [],
      is_active: true,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (entryError || !entry) {
    return NextResponse.json({ error: "Gagal menyimpan pengetahuan" }, { status: 500 });
  }

  await admin
    .schema("knowledge")
    .from("gaps")
    .update({ status: "answered", answer, entry_id: entry.id, resolved_at: now, resolved_by: user.id })
    .eq("id", gapId);

  return NextResponse.json({ success: true, entryId: entry.id });
}
