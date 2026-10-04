// src/app/api/whatsapp/webhook/route.ts

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/crm/normalizePhone'
import { findOrCreateLeadConversation } from '@/lib/chat/conversations'
import { generateUniqueLeadSlug } from '@/lib/crm/slugify'
import { getAssigneeForPhoneNumberId } from '@/lib/whatsapp/whatsappNumbers'
import { interpretLeadReply } from '@/lib/ai/interpretLeadReply'
import { applyAgentDecision, logAgentRunFailure, AI_SUMMARY_NOTE_AUTHOR_LABEL } from '@/lib/ai/applyAgentDecision'
import { findRelevantKnowledge } from '@/lib/ai/knowledgeBase'
import { buildKprSimulationText, isSubsidiListing, parseDpFromText } from '@/lib/kpr/calculator'
import { findRelevantListings } from '@/lib/ai/relevantListings'
import { sendTypingIndicator } from '@/lib/whatsapp/kapso'
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

/**
 * Terima event webhook dari Kapso (WhatsApp Business Cloud API resmi Meta).
 *
 * Diamankan lewat HMAC signature (header X-Webhook-Signature), bukan sesi
 * login -- pemanggilnya server Kapso, bukan browser. Route ini harus tetap
 * bisa diakses selama platform lock aktif, lihat src/lib/platform-lock.ts.
 *
 * Fase ini cuma menangani whatsapp.message.received (pesan masuk -> simpan
 * ke chat.conversations/chat.messages, dicocokkan ke customer.leads lewat
 * nomor HP). Event lain (message.sent/delivered/read/failed,
 * conversation.*, contact.*) diterima dan di-ack 200 tanpa diproses --
 * itu bagian "kirim pesan keluar" yang belum dibangun.
 */

interface KapsoMessage {
  id: string
  type: string
  from?: string
  text?: { body?: string }
  kapso?: {
    direction?: string
    content?: string | null
    has_media?: boolean
  }
}

interface KapsoConversation {
  id?: string
  contact_name?: string | null
  phone_number?: string
  phone_number_id?: string
}

interface KapsoMessageReceivedPayload {
  message: KapsoMessage
  conversation?: KapsoConversation
  // Nomor WA KITA (Kapso phone_number_id) yang menerima pesan ini -- ada di
  // top level payload (dikonfirmasi docs.kapso.ai), dipakai buat tentukan
  // pemilik default lead baru + nomor pengirim balasan nanti. Beda dari
  // conversation.phone_number yang itu nomor LEAD, bukan nomor kita.
  phone_number_id?: string
}

// message.kapso.has_media dari Kapso ternyata tidak selalu terisi untuk
// pesan media sungguhan (ketemu kosong di produksi walau type-nya "image"),
// jadi type pesan dipakai sebagai sumber kebenaran, bukan flag itu sendiri.
const MEDIA_MESSAGE_TYPES = new Set(['image', 'video', 'audio', 'document', 'sticker'])

interface KapsoWebhookBatchBody {
  batch: true
  data: KapsoMessageReceivedPayload[]
}

type KapsoWebhookBody = KapsoMessageReceivedPayload | KapsoWebhookBatchBody

function isBatch(body: KapsoWebhookBody): body is KapsoWebhookBatchBody {
  return (body as KapsoWebhookBatchBody).batch === true
}

/**
 * Kapso auto-generate webhook secret BERBEDA tiap nomor (dikonfirmasi Yohan
 * 2 Oktober 2026, tidak bisa diisi custom) -- begitu ada nomor kedua, 1
 * secret global saja tidak cukup lagi. Cocokkan terhadap SEMUA secret yang
 * mungkin (env var global + tiap webhook_secret per nomor di
 * chat.whatsapp_numbers), terima kalau salah satu match -- jumlah nomor
 * realistis kecil (segelintir), jadi O(n) ini murah.
 */
function verifySignature(
  rawBody: string,
  signature: string | null,
  secrets: string[]
): boolean {
  if (!signature || secrets.length === 0) return false

  const signatureBuf = Buffer.from(signature, 'utf8')

  return secrets.some((secret) => {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedBuf = Buffer.from(expected, 'utf8')
    return expectedBuf.length === signatureBuf.length && crypto.timingSafeEqual(expectedBuf, signatureBuf)
  })
}

async function getCandidateWebhookSecrets(supabase: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const secrets: string[] = []
  if (process.env.KAPSO_WEBHOOK_SECRET) secrets.push(process.env.KAPSO_WEBHOOK_SECRET)

  const { data } = await supabase
    .schema('chat')
    .from('whatsapp_numbers')
    .select('webhook_secret')
    .not('webhook_secret', 'is', null)

  for (const row of data ?? []) {
    if (row.webhook_secret) secrets.push(row.webhook_secret)
  }

  return secrets
}

/**
 * Buat lead baru otomatis kalau pesan WA masuk dari nomor yang belum pernah
 * terdaftar -- ditemukan 2 Oktober 2026 begitu nomor produksi live: AI Agent
 * cuma jalan kalau nomor pengirim sudah match lead yang ADA, jadi lead baru
 * dari iklan/baliho yang chat duluan (belum pernah masuk CRM) didiamkan
 * total. Source "WhatsApp" (sudah ada di customer.lead_sources) dipakai
 * supaya kelihatan asalnya dari sini, bukan Google Form/Input Manual.
 *
 * assigned_to WAJIB diisi (RLS leads_owner_or_admin) -- diambil dari
 * chat.whatsapp_numbers (migration 056, dikelola lewat UI admin di
 * Settings) berdasarkan phoneNumberId nomor KITA yang menerima pesan ini --
 * BUKAN env var tunggal lagi, supaya tiap nomor WA (tiap agent/user) bisa
 * punya pemilik defaultnya sendiri-sendiri (persiapan multi-agent/SaaS).
 * Kalau nomornya belum terdaftar di tabel itu, sengaja TIDAK membuat lead
 * (balik ke perilaku lama -- pesan tetap tersimpan sebagai conversation
 * tanpa lead, AI tidak jalan) daripada membuat lead tanpa assigned_to yang
 * cuma kelihatan oleh admin.
 */
async function autoCreateLeadFromWhatsApp(
  supabase: ReturnType<typeof createAdminClient>,
  phone: string,
  contactName: string | null,
  phoneNumberId: string | null,
  origin: { isAd: boolean; kapurMas: boolean }
): Promise<string | null> {
  if (!phoneNumberId) return null

  const assignedTo = await getAssigneeForPhoneNumberId(supabase, phoneNumberId)
  if (!assignedTo) return null

  const [{ data: source }, slug] = await Promise.all([
    supabase.schema('customer').from('lead_sources').select('id').eq('name', 'WhatsApp').maybeSingle(),
    generateUniqueLeadSlug(supabase, contactName ?? phone, ''),
  ])

  const { data: inserted, error } = await supabase
    .schema('customer')
    .from('leads')
    .insert({
      lead_source_id: source?.id ?? null,
      // "(NN)" = lead belum pernah menyebut namanya sendiri; diganti nama asli
      // begitu AI menangkapnya dari percakapan (confirmedName) -- dan jadi sinyal
      // supaya AI menanyakan nama dengan sopan.
      first_name: contactName ? `${contactName} (NN)` : phone,
      last_name: '',
      slug,
      phone,
      status: 'new',
      assigned_to: assignedTo,
      metadata: {
        origin: 'whatsapp_inbound',
        sumber_informasi: origin.isAd ? 'Iklan (Meta/Google)' : null,
        kategori: origin.kapurMas ? 'Calon Konsumen Kapur Mas' : null,
        permintaan: null,
        komentar: null,
        minat_unit_lokasi: origin.kapurMas ? 'Kapur Mas' : null,
        sudah_survey: 'Belum',
        status_funnel_awal: null,
        follow_up_terakhir: null,
        submitted_at: new Date().toISOString(),
      },
    })
    .select('id')
    .single()

  if (error || !inserted) return null
  return inserted.id
}

const META_SYSTEM_PHONE = '447710173736'

/**
 * Konteks iklan Click-to-WhatsApp yang diklik lead (headline/body/link iklan).
 * Meta mengirimnya sebagai `message.referral` di pesan PERTAMA dari iklan --
 * docs Kapso tidak mendokumentasikannya, jadi dibaca defensif; kalau Kapso tidak
 * meneruskannya hasilnya kosong dan alur lama tetap jalan.
 */
interface DatangDari {
  platform: string | null
  tipe: string | null
  judul: string | null
  isi: string | null
  url: string | null
}

/** Asal lead (postingan/iklan) terstruktur untuk ditampilkan di Lead Detail ("Datang dari"). */
function extractDatangDari(payload: KapsoMessageReceivedPayload): DatangDari | null {
  const referral = (payload.message as { referral?: Record<string, unknown> }).referral
  if (!referral || typeof referral !== 'object') return null

  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const url = str(referral.source_url)
  const host = (() => {
    try {
      return url ? new URL(url).hostname.toLowerCase() : ''
    } catch {
      return ''
    }
  })()

  let platform: string | null = null
  if (/(^|.)(fb.me|facebook.com|fb.com)$/.test(host)) platform = 'Facebook'
  else if (/(^|.)(instagram.com|ig.me|instagr.am)$/.test(host)) platform = 'Instagram'
  else if (/(^|.)tiktok.com$/.test(host)) platform = 'TikTok'

  const sourceType = str(referral.source_type)
  const tipe = sourceType === 'ad' ? 'Iklan' : sourceType === 'post' ? 'Postingan' : null

  return { platform, tipe, judul: str(referral.headline), isi: str(referral.body), url }
}

async function saveDatangDariIfMissing(
  supabase: ReturnType<typeof createAdminClient>,
  leadId: string,
  datangDari: DatangDari
) {
  const { data: lead } = await supabase.schema('customer').from('leads').select('metadata').eq('id', leadId).maybeSingle()
  if (!lead) return
  const metadata = (lead.metadata ?? {}) as Record<string, unknown>
  if (metadata.datang_dari) return
  await supabase
    .schema('customer')
    .from('leads')
    .update({ metadata: { ...metadata, datang_dari: datangDari } as unknown as Json })
    .eq('id', leadId)
}

function extractAdContext(payload: KapsoMessageReceivedPayload): string | null {
  const referral = (payload.message as { referral?: Record<string, unknown> }).referral
  if (!referral || typeof referral !== 'object') return null
  const parts = [referral.headline, referral.body, referral.source_url]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim())
  return parts.length > 0 ? parts.join(' | ') : null
}

/**
 * Asal lead WhatsApp baru. Kapso MENERUSKAN `message.referral` Meta (terbukti 3 Okt 2026):
 * headline = nama Page, body = caption postingan/iklan, source_url = link fb.me.
 * - isAd: referral bukan dari postingan Page biasa (source_type 'post'), ATAU teks pembuka
 *   iklan Kapur Mas ("minta info ... Kapur Mas").
 * - kapurMas: proyek Kapur Mas disebut di teks pembuka atau di konteks iklan/postingan.
 * Heuristik -- sesuaikan kalau teks iklan/proyek lain mulai jalan.
 */
function classifyLeadOrigin(
  payload: KapsoMessageReceivedPayload,
  content: string,
  adContext: string | null
): { isAd: boolean; kapurMas: boolean } {
  const referral = (payload.message as { referral?: { source_type?: unknown } }).referral
  const openingLooksLikeAd = /mintas+info.*kapurs*mas/i.test(content)
  const isAd =
    openingLooksLikeAd || Boolean(referral && typeof referral === 'object' && referral.source_type !== 'post')
  const kapurMas = openingLooksLikeAd || /kapurs*mas/i.test(adContext ?? '')
  return { isAd, kapurMas }
}

async function handleMessageReceived(
  supabase: ReturnType<typeof createAdminClient>,
  payload: KapsoMessageReceivedPayload
) {
  // Tipe "unsupported" -- notifikasi protokol WA (mis. pesan dihapus pengirim,
  // pesan sekali lihat) yang dikirim Meta lewat error 131051, BUKAN pesan
  // sungguhan. Kalau tidak dilewati, isi errornya kesimpan seolah-olah lead
  // benar-benar mengetik itu.
  if (payload.message.type === 'unsupported') return

  const rawPhone = payload.conversation?.phone_number ?? payload.message.from
  if (!rawPhone) return

  const phone = normalizePhone(rawPhone)

  // Akun resmi "Facebook Business" (notifikasi sistem Meta, mis. "WhatsApp
  // account connected to your Facebook Page") -- bukan lead, jangan dibuatkan
  // lead dan jangan sampai dibalas AI Agent.
  if (phone === META_SYSTEM_PHONE) return

  const waMessageId = payload.message.id
  const phoneNumberId = payload.phone_number_id ?? payload.conversation?.phone_number_id ?? null
  const content =
    payload.message.kapso?.content ??
    payload.message.text?.body ??
    `[${payload.message.type}]`

  const { data: existingMessage } = await supabase
    .schema('chat')
    .from('messages')
    .select('id')
    .eq('metadata->>wa_message_id', waMessageId)
    .limit(1)

  if (existingMessage && existingMessage.length > 0) return

  const { data: leads } = await supabase
    .schema('customer')
    .from('leads')
    .select('id')
    .eq('phone', phone)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)

  let leadId = leads?.[0]?.id ?? null

  let conversationId: string | null = null

  // Thread tanpa lead dari percakapan SEBELUMNYA di nomor yang sama (mis.
  // pesan pertama sebelum lead-nya dibuat otomatis) -- diadopsi begitu
  // lead-nya ada, supaya riwayatnya tidak kepisah jadi 2 thread.
  let orphanConversationId: string | null = null
  if (!leadId) {
    const { data: orphanConversations } = await supabase
      .schema('chat')
      .from('conversations')
      .select('id')
      .is('lead_id', null)
      .contains('metadata', { phone })
      .order('updated_at', { ascending: false })
      .limit(1)
    orphanConversationId = orphanConversations?.[0]?.id ?? null

    leadId = await autoCreateLeadFromWhatsApp(
      supabase,
      phone,
      payload.conversation?.contact_name ?? null,
      phoneNumberId,
      classifyLeadOrigin(payload, content, extractAdContext(payload))
    )

    if (leadId && orphanConversationId) {
      await supabase.schema('chat').from('conversations').update({ lead_id: leadId }).eq('id', orphanConversationId)
    }
  }

  if (leadId) {
    conversationId = orphanConversationId
      ?? (await findOrCreateLeadConversation(supabase, leadId, payload.conversation?.contact_name ?? phone, phoneNumberId))
  } else {
    conversationId = orphanConversationId
  }

  if (!conversationId) {
    const { data: created, error: createError } = await supabase
      .schema('chat')
      .from('conversations')
      .insert({
        lead_id: leadId,
        title: payload.conversation?.contact_name ?? phone,
        status: 'active',
        metadata: { phone, kapso_conversation_id: payload.conversation?.id ?? null, phone_number_id: phoneNumberId },
      })
      .select('id')
      .single()

    if (createError || !created) return
    conversationId = created.id
  }

  const adContext = extractAdContext(payload)

  const datangDari = extractDatangDari(payload)
  if (leadId && datangDari) await saveDatangDariIfMissing(supabase, leadId, datangDari)

  const { data: insertedMessage, error: insertError } = await supabase
    .schema('chat')
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'customer',
      content,
      metadata: {
        wa_message_id: waMessageId,
        message_type: payload.message.type,
        has_media: MEDIA_MESSAGE_TYPES.has(payload.message.type) || (payload.message.kapso?.has_media ?? false),
        ...(adContext ? { ad_context: adContext } : {}),
      },
    })
    .select('id')
    .single()

  if (insertError) return

  // Sentuh baris conversation supaya trigger core.update_updated_at_column
  // membangunkan updated_at -- Recent Chats di dashboard urut berdasarkan itu.
  await supabase
    .schema('chat')
    .from('conversations')
    .update({ status: 'active' })
    .eq('id', conversationId)

  // Pesan media/non-teks tidak dikirim ke AI Agent -- content-nya cuma
  // placeholder ("[image]" dst), bukan sesuatu yang bisa diinterpretasi.
  // Balasan tombol quick-reply template (mis. "Sudah dapat rumah") datang
  // bertipe 'button'/'interactive', tapi isinya teks biasa -- harus diproses AI.
  const isTextMessage = ['text', 'button', 'interactive'].includes(payload.message.type) && Boolean(payload.message.text?.body ?? payload.message.kapso?.content)

  if (leadId && isTextMessage && process.env.ANTHROPIC_API_KEY) {
    // Best-effort -- indikator "mengetik" cuma UX, jangan sampai gagal
    // ngirim ini menggagalkan pemrosesan AI Agent yang sebenarnya.
    await sendTypingIndicator(waMessageId, phoneNumberId).catch(() => {})
    // Konteks iklan ditempel HANYA ke teks yang dikirim ke AI (bukan ke pesan yang tersimpan),
    // supaya AI tahu proyek apa yang sedang diiklankan walau pesan lead cuma "info selengkapnya".
    const messageForAi = adContext ? `${content}
[Konteks: lead menekan iklan "${adContext}"]` : content
    await runAiAgent(supabase, leadId, conversationId, insertedMessage.id, messageForAi, phoneNumberId)
  }
}

async function runAiAgent(
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
  const kprListing = dpFromLead ? listings.find((l) => l.price) : undefined
  const kprSimulation =
    dpFromLead && kprListing
      ? buildKprSimulationText({
          listingTitle: kprListing.title,
          price: kprListing.price,
          dp: dpFromLead,
          subsidi: isSubsidiListing({ aiTags: kprListing.aiTags, title: kprListing.title, description: kprListing.description }),
        })
      : null

  const inputSnapshot = { leadContext, history, newMessage, knowledge, listings, previousSummary, kprSimulation } as unknown as Json

  const { decision, rawResponse, error } = await interpretLeadReply(
    leadContext,
    history,
    newMessage,
    knowledge,
    listings,
    previousSummary,
    kprSimulation
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

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-webhook-signature')

  const supabase = createAdminClient()
  const candidateSecrets = await getCandidateWebhookSecrets(supabase)

  if (candidateSecrets.length === 0) {
    return NextResponse.json({ error: 'Webhook belum dikonfigurasi' }, { status: 500 })
  }

  if (!verifySignature(rawBody, signature, candidateSecrets)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: KapsoWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = request.headers.get('x-webhook-event')
  if (event !== 'whatsapp.message.received') {
    return NextResponse.json({ success: true })
  }

  const payloads = isBatch(body) ? body.data : [body]

  for (const payload of payloads) {
    await handleMessageReceived(supabase, payload)
  }

  return NextResponse.json({ success: true })
}
