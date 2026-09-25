// src/lib/crm/createLead.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { normalizePhone } from "@/lib/crm/normalizePhone";

export interface CreateLeadInput {
  nama: string;
  phone: string;
  email?: string;
  kategori?: string;
  sumberInformasi?: string;
  minatUnitLokasi?: string;
  permintaan?: string;
  komentar?: string;
  sudahSurvey?: string;
  statusFunnelAwal?: string;
  /** Wajib -- RLS leads_owner_or_admin menolak insert kalau bukan diri sendiri (non-admin) atau tidak diisi. */
  assignedTo: string;
}

export interface CreateLeadResult {
  leadId: string | null;
  error: string | null;
}

/**
 * Insert lead manual dari dashboard (bukan lewat Google Form). Field &
 * bentuk metadata sengaja dibuat sama seperti POST /api/leads/intake
 * supaya Lead Detail bisa menampilkan keduanya tanpa cabang kasus khusus.
 */
export async function createLead(
  supabase: SupabaseClient<Database>,
  input: CreateLeadInput
): Promise<CreateLeadResult> {
  const { data: source } = await supabase
    .schema("customer")
    .from("lead_sources")
    .select("id")
    .eq("name", "Input Manual")
    .maybeSingle();

  const { data: inserted, error } = await supabase
    .schema("customer")
    .from("leads")
    .insert({
      lead_source_id: source?.id ?? null,
      first_name: input.nama.trim(),
      last_name: "",
      phone: normalizePhone(input.phone),
      email: input.email?.trim() || null,
      status: "new",
      assigned_to: input.assignedTo,
      metadata: {
        origin: "manual_dashboard",
        sumber_informasi: input.sumberInformasi || null,
        kategori: input.kategori || null,
        permintaan: input.permintaan || null,
        komentar: input.komentar || null,
        minat_unit_lokasi: input.minatUnitLokasi || null,
        sudah_survey: input.sudahSurvey || null,
        status_funnel_awal: input.statusFunnelAwal || null,
        follow_up_terakhir: null,
        submitted_at: new Date().toISOString(),
      },
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { leadId: null, error: error?.message ?? "Insert gagal" };
  }

  return { leadId: inserted.id, error: null };
}
