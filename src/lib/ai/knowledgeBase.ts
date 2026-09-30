// src/lib/ai/knowledgeBase.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface KnowledgeMatch {
  title: string;
  content: string;
  relatedListingTerms: string[];
}

/**
 * Cari entri knowledge.entries yang relevan dengan pesan lead -- pencocokan
 * substring sederhana (bukan full-text/semantic search), cukup untuk jumlah
 * entri yang kecil. Yohan bisa tambah entri sendiri lewat SQL/dashboard
 * Supabase untuk sekarang -- UI kelola khusus belum dibangun.
 */
export async function findRelevantKnowledge(
  supabaseAdmin: SupabaseClient<Database>,
  messageText: string
): Promise<KnowledgeMatch[]> {
  const { data } = await supabaseAdmin
    .schema("knowledge")
    .from("entries")
    .select("title, content, keywords, related_listing_terms")
    .eq("is_active", true);

  if (!data) return [];

  const lowerMessage = messageText.toLowerCase();

  return data
    .filter((entry) => entry.keywords.some((kw) => lowerMessage.includes(kw.toLowerCase())))
    .map((entry) => ({
      title: entry.title,
      content: entry.content,
      relatedListingTerms: entry.related_listing_terms,
    }));
}
