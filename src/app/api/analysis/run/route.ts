// src/app/api/analysis/run/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canViewPlatformDashboard } from "@/lib/admin/platformAccess";
import { generateWeeklyAnalysis } from "@/lib/analysis/generateWeeklyAnalysis";

const MIN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Buat analisis sekarang (tombol di Master Admin). Hak akses = sama dengan halaman /admin (admin atau penanda laporan
 * platform), diperiksa dari sesi login -- tidak memakai secret cron. Menimpa laporan hari ini dan mengirim ulang email ke
 * pemilik; dibatasi satu kali per 5 menit supaya tidak membakar biaya AI dan email.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canViewPlatformDashboard(supabase, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: latest } = await admin.schema("ai").from("analysis_reports").select("created_at").eq("kind", "weekly").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (latest && Date.now() - new Date(latest.created_at).getTime() < MIN_INTERVAL_MS) {
    return NextResponse.json({ error: "Analisis baru saja dibuat. Tunggu beberapa menit sebelum membuat lagi." }, { status: 429 });
  }

  const result = await generateWeeklyAnalysis(admin, { force: true });
  return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
}
