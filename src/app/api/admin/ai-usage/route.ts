// src/app/api/admin/ai-usage/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReportDayWindow } from "@/lib/reports/getDailyReport";
import { getAiUsageSummary } from "@/lib/reports/getAiUsageSummary";
import { getAnthropicBilling } from "@/lib/reports/getAnthropicBilling";

/**
 * Pemakaian & biaya AI dalam JSON (estimasi aplikasi + tagihan asli Anthropic) -- khusus admin yang login.
 * Dipakai untuk mengecek koneksi Admin API key sekarang, dan jadi sumber data dashboard Master Admin nanti.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: isAdmin } = await supabase.schema("core").rpc("is_admin_or_above");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { startISO, endISO } = getReportDayWindow();
  const [estimate, billing] = await Promise.all([
    getAiUsageSummary(createAdminClient(), startISO, endISO),
    getAnthropicBilling(),
  ]);

  return NextResponse.json({ estimate, billing });
}
