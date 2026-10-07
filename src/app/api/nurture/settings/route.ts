// src/app/api/nurture/settings/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_NURTURE_SETTINGS,
  sanitizeNurtureSettings,
  settingsFromRow,
  settingsToRow,
} from "@/lib/nurture/settings";

/**
 * Aturan nurturing otomatis milik akun yang login. Schema `ai` tidak dibuka untuk
 * role authenticated, jadi baca/tulis lewat service_role -- identitas SELALU dari sesi
 * (user.id), tidak pernah dari body, supaya tidak bisa mengubah aturan akun lain.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await createAdminClient().schema("ai").from("nurture_settings").select("*").eq("user_id", user.id).maybeSingle();
  return NextResponse.json({
    settings: data ? settingsFromRow(data) : DEFAULT_NURTURE_SETTINGS,
    saved: Boolean(data),
    masterEnabled: process.env.NURTURE_ENABLED === "true",
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const settings = sanitizeNurtureSettings(body);
  if (settings.allowedTemperatures.length === 0) {
    return NextResponse.json({ error: "Pilih minimal satu Temperature." }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .schema("ai")
    .from("nurture_settings")
    .upsert({ user_id: user.id, ...settingsToRow(settings) });
  if (error) return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });

  return NextResponse.json({ success: true, settings });
}
