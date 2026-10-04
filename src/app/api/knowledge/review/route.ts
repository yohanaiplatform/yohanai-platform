// src/app/api/knowledge/review/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isKnowledgeCurator } from "@/lib/knowledge/curator";

/**
 * Kurator menyetujui/menolak usulan pengetahuan (entri) atau titik peta dari user lain.
 * Hanya yang approved yang dipakai AI Agent. Diamankan sesi login + tanda kurator.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  if (!(await isKnowledgeCurator(admin, user.id))) {
    return NextResponse.json({ error: "Hanya kurator yang boleh meninjau usulan" }, { status: 403 });
  }

  let body: { kind?: string; id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { kind, id, action } = body;
  if (!id || (kind !== "entry" && kind !== "place") || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "kind (entry|place), id, action (approve|reject) wajib diisi" }, { status: 400 });
  }

  const approved = action === "approve";

  if (kind === "entry") {
    await admin
      .schema("knowledge")
      .from("entries")
      .update({ review_status: approved ? "approved" : "rejected", is_active: approved, updated_by: user.id })
      .eq("id", id)
      .eq("review_status", "pending");
  } else {
    await admin
      .schema("knowledge")
      .from("places")
      .update({ review_status: approved ? "approved" : "rejected" })
      .eq("id", id)
      .eq("review_status", "pending");
  }

  return NextResponse.json({ success: true });
}
