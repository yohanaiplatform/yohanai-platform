// src/app/api/branding/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2, r2KeyFromUrl } from "@/lib/storage/r2";
import { brandingToJson, getUserBranding } from "@/lib/branding/branding";

/** Status logo/watermark pengguna yang login (tanpa URL R2 -- gambar diambil lewat /api/branding/file/<kind>). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await getUserBranding(supabase, user.id);
  const pub = (a: typeof b.watermark) => (a ? { width: a.width, height: a.height, updatedAt: a.updatedAt } : null);
  return NextResponse.json({ watermark: pub(b.watermark), docLogo: pub(b.docLogo) });
}

/** Hapus logo/watermark milik sendiri: ?kind=watermark|logo (kembali ke bawaan). */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kind = new URL(request.url).searchParams.get("kind");
  if (kind !== "watermark" && kind !== "logo") return NextResponse.json({ error: "kind tidak valid" }, { status: 400 });

  const branding = await getUserBranding(supabase, user.id);
  const slot = kind === "watermark" ? "watermark" : "docLogo";
  const previous = branding[slot];
  branding[slot] = null;

  const { error } = await supabase
    .schema("property")
    .from("document_settings")
    .upsert({ user_id: user.id, branding: brandingToJson(branding), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });

  const oldKey = previous ? r2KeyFromUrl(previous.url) : null;
  if (oldKey && oldKey.startsWith(`branding/${user.id}/`)) await deleteFromR2(oldKey).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
