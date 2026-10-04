// src/lib/knowledge/curator.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Kurator pengetahuan AI = auth_ext.profiles.is_knowledge_curator (hanya admin/service_role yang bisa mengubahnya). */
export async function isKnowledgeCurator(admin: SupabaseClient<Database>, userId: string): Promise<boolean> {
  const { data } = await admin.schema("auth_ext").from("profiles").select("is_knowledge_curator").eq("user_id", userId).maybeSingle();
  return data?.is_knowledge_curator === true;
}

export async function getCuratorUserIds(admin: SupabaseClient<Database>): Promise<string[]> {
  const { data } = await admin.schema("auth_ext").from("profiles").select("user_id").eq("is_knowledge_curator", true);
  return (data ?? []).map((row) => row.user_id as string);
}
