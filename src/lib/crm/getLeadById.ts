// src/lib/crm/getLeadById.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface LeadDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: Json;
  lead_source_name: string | null;
}

export interface GetLeadByIdResult {
  data: LeadDetail | null;
  error: boolean;
}

export async function getLeadById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<GetLeadByIdResult> {
  const { data: lead, error } = await supabase
    .schema("customer")
    .from("leads")
    .select(
      "id, first_name, last_name, email, phone, status, created_at, updated_at, metadata, lead_source_id"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

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
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      metadata: lead.metadata,
      lead_source_name,
    },
    error: false,
  };
}
