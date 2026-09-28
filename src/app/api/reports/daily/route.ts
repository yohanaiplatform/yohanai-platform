// src/app/api/reports/daily/route.ts

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDailyReport } from "@/lib/reports/getDailyReport";
import { sendDailyReportEmail } from "@/lib/reports/sendDailyReportEmail";

/**
 * Dipanggil GitHub Actions cron (.github/workflows/daily-report.yml), bukan
 * browser -- diamankan lewat secret header, pola sama persis seperti
 * POST /api/leads/intake. Pakai service-role client karena report ini
 * butuh angka lintas SEMUA agent (RLS leads_owner_or_admin/
 * listings_owner_or_admin akan mempersempit ke satu user kalau pakai
 * session client biasa).
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-report-secret");
  if (!secret || secret !== process.env.DAILY_REPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const report = await getDailyReport(supabase);
  const { error } = await sendDailyReportEmail(report);

  if (error) {
    return NextResponse.json({ success: false, report, error }, { status: 500 });
  }

  return NextResponse.json({ success: true, report });
}
