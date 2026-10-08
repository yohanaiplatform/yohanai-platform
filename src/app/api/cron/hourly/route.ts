// src/app/api/cron/hourly/route.ts

import { NextResponse } from "next/server";
import { GET as flushFollowUps } from "@/app/api/ai/flush-follow-ups/route";
import { GET as sendDigest } from "@/app/api/ai/send-digest/route";
import { GET as sendDailyReport } from "@/app/api/reports/daily/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { runNurture } from "@/lib/nurture/runNurture";
import { generateKnowledgeGaps } from "@/lib/knowledge/generateGaps";
import { resumeUnansweredAfterPause } from "@/lib/ai/resumeSweep";

const WIB_OFFSET_HOURS = 7;
const DIGEST_HOURS_WIB = [8, 13, 21];
const DAILY_REPORT_HOUR_WIB = 7;

/**
 * SATU pemicu untuk semua pekerjaan terjadwal -- dipanggil TIAP JAM oleh
 * cron eksternal (cron-job.org) dengan header `x-flush-secret`
 * (AI_FOLLOW_UP_FLUSH_SECRET). Menggantikan 3 entri cron terpisah supaya
 * pengaturan di sisi cron cukup 1 entri + 1 secret:
 *
 * - tiap jam: flush antrean follow-up AI (notifikasi in-app)
 * - jam 08/13/21 WIB: rangkuman chat ke WhatsApp agen
 * - jam 07 WIB: Daily Report + Platform Report
 * - jam 06 WIB: Knowledge Loop (rangkum celah pengetahuan AI -> Settings)
 * - tiap jam (08-20 WIB): nurturing template ke lead diam (dry-run kecuali NURTURE_ENABLED=true)
 *
 * Handler lain dipanggil langsung (bukan lewat HTTP), dengan secret masing-
 * masing dibaca dari env server -- DAILY_REPORT_SECRET tidak perlu diketahui
 * pemanggil. `?force=<flush|digest|daily>` memicu satu pekerjaan di luar jam
 * (tes manual).
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-flush-secret");
  if (!secret || secret !== process.env.AI_FOLLOW_UP_FLUSH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force");
  const wibHour = (new Date().getUTCHours() + WIB_OFFSET_HOURS) % 24;

  const flushHeaders = { "x-flush-secret": secret };
  const results: Record<string, unknown> = { wibHour };

  async function run(name: string, task: () => Promise<Response>) {
    try {
      const response = await task();
      results[name] = { status: response.status, body: await response.json().catch(() => null) };
    } catch (error) {
      results[name] = { error: error instanceof Error ? error.message : "gagal" };
    }
  }

  await run("flush", () => flushFollowUps(new Request(url, { headers: flushHeaders })));

  if (force === "digest" || DIGEST_HOURS_WIB.includes(wibHour)) {
    const digestUrl = new URL(url);
    digestUrl.searchParams.set("force", "1");
    await run("digest", () => sendDigest(new Request(digestUrl, { headers: flushHeaders })));
  }

  if (force === "daily" || wibHour === DAILY_REPORT_HOUR_WIB) {
    await run("daily", () =>
      sendDailyReport(
        new Request(url, { headers: { "x-report-secret": process.env.DAILY_REPORT_SECRET ?? "" } })
      )
    );
  }

  // Jeda AI yang baru berakhir: jawab pesan lead yang tertinggal selama jeda dan belum dibalas siapa pun.
  try {
    results.resumeSweep = await resumeUnansweredAfterPause(createAdminClient());
  } catch (error) {
    results.resumeSweep = { error: error instanceof Error ? error.message : "gagal" };
  }

  // Nurturing otomatis (DRY-RUN kecuali env NURTURE_ENABLED=true; hanya jam 08-20 WIB).
  try {
    results.nurture = await runNurture(createAdminClient());
  } catch (error) {
    results.nurture = { error: error instanceof Error ? error.message : "gagal" };
  }

  // Knowledge Loop: rangkum celah pengetahuan AI tiap pagi jam 06 WIB.
  if (force === "gaps" || wibHour === 6) {
    try {
      results.gaps = await generateKnowledgeGaps(createAdminClient());
    } catch (error) {
      results.gaps = { error: error instanceof Error ? error.message : "gagal" };
    }
  }

  return NextResponse.json(results);
}
