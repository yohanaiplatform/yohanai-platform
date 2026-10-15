// src/app/api/leads/export/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllLeadsForExport, type LeadFilters } from "@/lib/crm/getLeads";
import { buildLeadsCsv } from "@/lib/crm/exportLeadsCsv";

/**
 * Download CSV sesuai filter yang aktif di Lead List. Session-based
 * (bukan service-role) -- RLS leads_owner_or_admin otomatis berlaku,
 * jadi non-admin cuma bisa export lead miliknya sendiri, tanpa perlu
 * kode pembatas tambahan di route ini.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const filters: LeadFilters = {
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    kategori: searchParams.get("kategori") || undefined,
    sumber: searchParams.get("sumber") || undefined,
    temperature: searchParams.get("temperature") || undefined,
    search: searchParams.get("search") || undefined,
  };

  const [{ data: rows, error }, { data: assignableUsers }] = await Promise.all([
    getAllLeadsForExport(supabase, filters),
    supabase.schema("core").rpc("list_assignable_users"),
  ]);

  if (error) {
    return NextResponse.json({ error: "Gagal mengambil data lead" }, { status: 500 });
  }

  const assignedToLabels = new Map(
    (assignableUsers ?? []).map((u) => [
      u.user_id,
      u.display_name ?? u.email ?? u.user_id,
    ])
  );

  const csv = buildLeadsCsv(rows, assignedToLabels);
  const filename = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
