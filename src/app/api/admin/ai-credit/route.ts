// src/app/api/admin/ai-credit/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReportDayWindow } from "@/lib/reports/getDailyReport";
import { getAiUsageSummary } from "@/lib/reports/getAiUsageSummary";
import { getAiCreditStatus } from "@/lib/reports/getAiCreditStatus";

/**
 * Catatan saldo kredit Claude Console -- khusus admin. GET = status taksiran saat ini; POST {balanceUsd} = catat
 * saldo asli terbaru (lihat Claude Console > Billing). Dasar pengingat saldo di Platform Report.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: isAdmin } = await supabase.schema("core").rpc("is_admin_or_above");
  if (!isAdmin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

async function currentStatus() {
  const admin = createAdminClient();
  const { startISO, endISO } = getReportDayWindow();
  const summary = await getAiUsageSummary(admin, startISO, endISO);
  return getAiCreditStatus(admin, summary.weekly.costUsd / 7);
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json({ status: await currentStatus() });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: { balanceUsd?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const balance = typeof body.balanceUsd === "number" ? body.balanceUsd : Number(body.balanceUsd);
  if (!Number.isFinite(balance) || balance < 0 || balance > 100000) {
    return NextResponse.json({ error: "Saldo harus angka 0 atau lebih (dalam USD)." }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .schema("ai")
    .from("credit_balance")
    .insert({ balance_usd: Math.round(balance * 100) / 100, recorded_by: auth.user.id });
  if (error) return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });

  return NextResponse.json({ success: true, status: await currentStatus() });
}
