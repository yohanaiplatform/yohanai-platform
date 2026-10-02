// src/lib/crm/getLeadBySlug.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface LeadDetail {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  metadata: Json;
  lead_source_name: string | null;
}

export interface GetLeadBySlugResult {
  data: LeadDetail | null;
  error: boolean;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cari lead lewat slug URL-nya (mis. "bang-yohan") -- kalau tidak ketemu DAN
 * nilainya berbentuk UUID, coba lagi lewat id (link lama/notifikasi yang
 * masih menunjuk /crm/<uuid> dari sebelum slug ada tetap jalan). Pemanggil
 * (page.tsx) bertanggung jawab redirect ke URL slug yang benar kalau lead
 * ketemu lewat jalur UUID ini, supaya address bar akhirnya selalu rapi.
 */
export async function getLeadBySlug(
  supabase: SupabaseClient<Database>,
  slugOrId: string
): Promise<GetLeadBySlugResult> {
  const columns =
    "id, slug, first_name, last_name, email, phone, status, assigned_to, created_at, updated_at, metadata, lead_source_id";

  let query = supabase.schema("customer").from("leads").select(columns).is("deleted_at", null);
  query = UUID_PATTERN.test(slugOrId) ? query.eq("id", slugOrId) : query.eq("slug", slugOrId);

  const { data: lead, error } = await query.maybeSingle();

  if (error) {
    return { data: null, error: true };
  }
  if (!lead) {
    return { data: null, error: false };
  }

  let lead_source_name: string | null = null;
  if (lead.lead_source_id) {
    const { data: source } = await supabase
      .schema("customer")
      .from("lead_sources")
      .select("name")
      .eq("id", lead.lead_source_id)
      .maybeSingle();
    lead_source_name = source?.name ?? null;
  }

  return {
    data: {
      id: lead.id,
      slug: lead.slug,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      assigned_to: lead.assigned_to,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      metadata: lead.metadata,
      lead_source_name,
    },
    error: false,
  };
}
