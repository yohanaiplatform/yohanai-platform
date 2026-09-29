// src/app/api/reports/daily/route.ts

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDailyReport } from "@/lib/reports/getDailyReport";
import { sendDailyReportEmail } from "@/lib/reports/sendDailyReportEmail";
import { getDailyReportRecipients } from "@/lib/reports/getDailyReportRecipients";
import { getPlatformReport } from "@/lib/reports/getPlatformReport";
import { sendPlatformReportEmail } from "@/lib/reports/sendPlatformReportEmail";

/**
 * Dipanggil GitHub Actions cron (.github/workflows/daily-report.yml), bukan
 * browser -- diamankan lewat secret header, pola sama persis seperti
 * POST /api/leads/intake.
 *
 * Personal per user (29 September 2026) -- setiap user terdaftar yang
 * belum matikan preferensi (auth_ext.notification_preferences.
 * daily_report_email) terima laporan sendiri: admin/super_admin dapat
 * agregat semua data, role lain di-scope ke assigned_to = dirinya sendiri
 * (pola sama seperti leads_owner_or_admin/listings_owner_or_admin).
 * Sebelumnya satu email statis (DAILY_REPORT_RECIPIENT) untuk semua orang.
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-report-secret");
  if (!secret || secret !== process.env.DAILY_REPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const recipients = await getDailyReportRecipients(supabase);

  const results = await Promise.all(
    recipients.map(async (recipient) => {
      const report = await getDailyReport(supabase, { assignedTo: recipient.isAdmin ? null : recipient.userId });
      const { error } = await sendDailyReportEmail(report, {
        email: recipient.email,
        displayName: recipient.displayName,
      });
      return { email: recipient.email, success: !error, error };
    })
  );

  const failed = results.filter((r) => !r.success);

  // Laporan developer terpisah -- selalu ke admin@yohanai.id (atau
  // PLATFORM_REPORT_RECIPIENT kalau di-override), tidak lewat preferensi
  // notifikasi user manapun karena ini bukan laporan bisnis.
  const platformReport = await getPlatformReport(supabase);
  const { error: platformError } = await sendPlatformReportEmail(platformReport);

  return NextResponse.json({
    success: failed.length === 0 && !platformError,
    sent: results.length - failed.length,
    failed,
    platformReport: platformError ? { success: false, error: platformError } : { success: true },
  });
}
