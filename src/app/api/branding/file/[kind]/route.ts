// src/app/api/branding/file/[kind]/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserBranding } from "@/lib/branding/branding";

/**
 * Sajikan logo/watermark milik pengguna yang login lewat origin yang sama (supaya canvas browser untuk watermark foto tidak
 * terkena batas CORS R2 dan <img> dokumen/cetak tidak bergantung URL bucket). Belum diatur: watermark -> logo bawaan
 * Yohan.AI; logo dokumen -> 404 (dokumen memakai teks nama kantor).
 */
export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (kind !== "watermark" && kind !== "logo") return new NextResponse(null, { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const branding = await getUserBranding(supabase, user.id);
  const entry = kind === "watermark" ? branding.watermark : branding.docLogo;

  if (!entry) {
    if (kind === "watermark") return NextResponse.redirect(new URL("/images/logo/logo-dark.png", request.url), 307);
    return new NextResponse(null, { status: 404 });
  }
  if (entry.url.startsWith("/")) return NextResponse.redirect(new URL(entry.url, request.url), 307);

  const upstream = await fetch(entry.url, { cache: "no-store" }).catch(() => null);
  if (!upstream || !upstream.ok) return new NextResponse(null, { status: 502 });
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
