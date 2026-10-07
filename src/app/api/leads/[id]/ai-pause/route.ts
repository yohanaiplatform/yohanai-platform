// src/app/api/leads/[id]/ai-pause/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAiPausedUntil, pauseAiForLead, resumeAiForLead } from "@/lib/ai/aiPause";

/**
 * Ambil alih percakapan dari AI Agent (jeda) dan kembalikan lagi. Sesi login dipakai hanya untuk memastikan
 * pemanggil boleh melihat lead itu (RLS leads_owner_or_admin); perubahan metadata lewat service-role.
 */
async function authorize(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: lead } = await supabase.schema("customer").from("leads").select("id, metadata").eq("id", id).maybeSingle();
  if (!lead) return { error: NextResponse.json({ error: "Lead tidak ditemukan" }, { status: 404 }) };
  return { lead };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if (auth.error) return auth.error;
  return NextResponse.json({ pausedUntil: getAiPausedUntil(auth.lead.metadata) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if (auth.error) return auth.error;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (body.action === "pause") {
    const pausedUntil = await pauseAiForLead(admin, id, "manual");
    return NextResponse.json({ pausedUntil });
  }
  if (body.action === "resume") {
    await resumeAiForLead(admin, id);
    return NextResponse.json({ pausedUntil: null });
  }
  return NextResponse.json({ error: "action harus 'pause' atau 'resume'" }, { status: 400 });
}
