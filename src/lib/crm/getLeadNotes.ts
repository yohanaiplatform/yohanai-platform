// src/lib/crm/getLeadNotes.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface LeadNote {
  id: string;
  note: string;
  author_label: string;
  created_at: string;
}

export interface GetLeadNotesResult {
  data: LeadNote[];
  error: boolean;
}

export async function getLeadNotes(
  supabase: SupabaseClient<Database>,
  leadId: string
): Promise<GetLeadNotesResult> {
  const { data, error } = await supabase
    .schema("customer")
    .from("notes")
    .select("id, note, author_label, created_at")
    .eq("lead_id", leadId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: true };
  }

  return { data, error: false };
}
