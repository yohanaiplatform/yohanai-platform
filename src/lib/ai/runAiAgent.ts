// src/lib/ai/runAiAgent.ts
//
// Jalankan AI Agent untuk satu pesan lead (kumpulkan konteks -> interpretLeadReply -> applyAgentDecision).
// Dipindah dari webhook WhatsApp supaya bisa dipanggil juga dari cron (resumeSweep: membalas pesan lead yang
// tertinggal setelah jeda AI berakhir). Wajib client service-role.

import { createAdminClient } from '@/lib/supabase/admin'
import { interpretLeadReply } from '@/lib/ai/interpretLeadReply'
import { applyAgentDecision, logAgentRunFailure, AI_SUMMARY_NOTE_AUTHOR_LABEL } from '@/lib/ai/applyAgentDecision'
import { findRelevantKnowledge } from '@/lib/ai/knowledgeBase'
import { buildGeoContext } from '@/lib/geo/placeContext'
import {
  buildKprSimulationText,
  isSubsidiListing,
  NON_SUBSIDI_MIN_DP_RATIO,
  parseDpFromText,
} from '@/lib/kpr/calculator'
import { findRelevantListings } from '@/lib/ai/relevantListings'
import type { Json } from '@/types/database'

// Stopword pendek buat saring kata umum dari pesan lead sebelum dipakai
// cari listing -- pencocokan sengaja sederhana (ILIKE), bukan NLP/semantic
// search, jadi kata generik yang tidak disaring bisa bikin hasil ngawur.
const STOPWORDS = new Set([
  'yang', 'ada', 'di', 'ke', 'dari', 'ini', 'itu', 'saya', 'apa', 'gimana',
  'dong', 'dulu', 'kalau', 'kah', 'nya', 'untuk', 'dengan', 'akan', 'masih',
  'sudah', 'belum', 'bisa', 'tidak', 'juga', 'atau', 'dan', 'saja', 'lagi',
  'kami', 'kita', 'anda', 'pak', 'bu', 'bang', 'min', 'kak', 'halo', 'hai',
])

function extractSearchTerms(message: string): string[] {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
}

export async function runAiAgent(
  supabase: ReturnType<typeof createAdminClient>,
  leadId: string,
  conversationId: string,
  triggerMessageId: string,
  newMessage: string,
  phoneNumberId: string | null
) {
  const { data: lead } = await supabase
    .schema('customer')
    .from('leads')
    .select('first_name, last_name, phone, metadata, assigned_to')
    .eq('id', leadId)
    .maybeSingle()

  if (!lead || !lead.phone) return

  const metadata = (lead.metadata ?? {}) as Record<string, unknown>
  const currentTemperature = (metadata.status_funnel_awal as string | undefined) ?? null

  const { data: recentMessages } = await supabase
    .schema('chat')
    .from('messages')
    .select('sender_type, content, created_at')
    .eq('conversation_id', conversationId)
    .neq('id', triggerMessageId)
    .order('created_at', { ascending: false })
    .limit(10)

  const history = (recentMessages ?? []).reverse().map((m) => ({ senderType: m.sender_type, content: m.content, createdAt: m.created_at }))

  // Ringkasan percakapan rolling (ditulis applyAgentDecision() tiap run) --
  // dibaca sebagai konteks jangka panjang, berguna juga kalau riwayat chat
  // di atas sudah panjang atau ada pesan WA lama yang hilang/terhapus.
  const { data: summaryNote } = await supabase
    .schema('customer')
    .from('notes')
    .select('note')
    .eq('lead_id', leadId)
    .eq('author_label', AI_SUMMARY_NOTE_AUTHOR_LABEL)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const previousSummary = summaryNote?.note ?? null

  const leadContext = {
    firstName: lead.first_name,
    lastName: lead.last_name,
    currentTemperature,
    sudahSurvey: (metadata.sudah_survey as string | undefined) ?? null,
    minatUnitLokasi: (metadata.minat_unit_lokasi as string | undefined) ?? null,
    permintaan: (metadata.permintaan as string | undefined) ?? null,
    komentar: (metadata.komentar as string | undefined) ?? null,
  }

  const knowledge = await findRelevantKnowledge(supabase, newMessage)
  // Pencarian listing juga baca beberapa pesan terakhir di percakapan, bukan
  // cuma pesan BARU -- follow-up singkat ("sudah bisa kirim foto?", "oke
  // makasih") sering tidak menyebut ulang nama/alamat listing yang sedang
  // dibahas, padahal listing itu masih "di meja". Tanpa ini, listing yang
  // sempat ke-detect di pesan pertama hilang lagi begitu lead balas singkat.
  const recentHistoryText = history.slice(-4).map((m) => m.content).join(' ')
  const listingSearchTerms = [
    ...extractSearchTerms(newMessage),
    ...extractSearchTerms(recentHistoryText),
    ...knowledge.flatMap((k) => k.relatedListingTerms),
  ]
  const listings = await findRelevantListings(supabase, listingSearchTerms)

  // Simulasi KPR dihitung di KODE (bukan oleh LLM) kalau lead menyebut nominal DP: pakai listing
  // paling relevan yang punya harga. Angka ini disuntik ke AI sebagai hasil final.
  const dpFromLead = parseDpFromText(newMessage)
  // Lead tanya KPR non-subsidi TANPA menyebut DP -> hitung dengan DP minimal 10% (aturan Yohan),
  // bukan menjawab "angka belum bisa disebutkan".
  const asksNonSubsidi = /non[s-]?subsidi|kpr biasa|kpr komersial|bukan subsidi/i.test(`${newMessage} ${recentHistoryText}`)
  const kprListing = dpFromLead || asksNonSubsidi ? listings.find((l) => l.price) : undefined
  const listingIsSubsidi = kprListing
    ? isSubsidiListing({ aiTags: kprListing.aiTags, title: kprListing.title, description: kprListing.description })
    : false
  const kprDp = dpFromLead ?? (kprListing?.price ? Math.round(kprListing.price * NON_SUBSIDI_MIN_DP_RATIO) : null)
  const kprSimulation =
    kprDp && kprListing
      ? buildKprSimulationText({
          listingTitle: kprListing.title,
          price: kprListing.price,
          dp: kprDp,
          // Kalau lead khusus menanyakan non-subsidi, jangan tampilkan skenario subsidi.
          subsidi: listingIsSubsidi && !asksNonSubsidi,
          dpIsMinimum: !dpFromLead,
        })
      : null

  // Data peta (jarak ke listing dari lokasi yang disebut lead + fasilitas sekitar) dihitung di KODE.
  // Gagal/kosong tidak boleh mengganggu balasan AI.
  let geoContext: string | null = null
  try {
    geoContext = await buildGeoContext(supabase, newMessage, listings.map((l) => l.title))
  } catch {
    geoContext = null
  }

  const inputSnapshot = { leadContext, history, newMessage, knowledge, listings, previousSummary, kprSimulation, geoContext } as unknown as Json

  const { decision, rawResponse, error } = await interpretLeadReply(
    leadContext,
    history,
    newMessage,
    knowledge,
    listings,
    previousSummary,
    kprSimulation,
    geoContext
  )

  if (error || !decision) {
    await logAgentRunFailure(supabase, {
      leadId,
      conversationId,
      triggerMessageId,
      inputSnapshot,
      rawResponse: rawResponse ?? null,
      errorMessage: error ?? 'Keputusan AI Agent kosong',
    })
    return
  }

  await applyAgentDecision(supabase, {
    leadId,
    leadName: `${lead.first_name} ${lead.last_name}`.trim() || lead.phone,
    currentFirstName: lead.first_name,
    leadPhone: lead.phone,
    assignedTo: lead.assigned_to,
    conversationId,
    triggerMessageId,
    currentMetadata: lead.metadata,
    currentTemperature,
    decision,
    inputSnapshot,
    rawResponse,
    phoneNumberId,
  })
}
