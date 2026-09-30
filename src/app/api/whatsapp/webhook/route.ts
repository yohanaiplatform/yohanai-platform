// src/app/api/whatsapp/webhook/route.ts

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/crm/normalizePhone'
import { findOrCreateLeadConversation } from '@/lib/chat/conversations'
import { interpretLeadReply } from '@/lib/ai/interpretLeadReply'
import { applyAgentDecision, logAgentRunFailure } from '@/lib/ai/applyAgentDecision'

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
}

interface KapsoMessageReceivedPayload {
  message: KapsoMessage
  conversation?: KapsoConversation
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

function verifySignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected, 'utf8')
  const signatureBuf = Buffer.from(signature, 'utf8')

  return (
    expectedBuf.length === signatureBuf.length &&
    crypto.timingSafeEqual(expectedBuf, signatureBuf)
  )
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
  const waMessageId = payload.message.id
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

  const leadId = leads?.[0]?.id ?? null

  let conversationId: string | null = null

  if (leadId) {
    conversationId = await findOrCreateLeadConversation(
      supabase,
      leadId,
      payload.conversation?.contact_name ?? phone
    )
  } else {
    const { data: conversations } = await supabase
      .schema('chat')
      .from('conversations')
      .select('id')
      .is('lead_id', null)
      .contains('metadata', { phone })
      .order('updated_at', { ascending: false })
      .limit(1)
    conversationId = conversations?.[0]?.id ?? null
  }

  if (!conversationId) {
    const { data: created, error: createError } = await supabase
      .schema('chat')
      .from('conversations')
      .insert({
        lead_id: leadId,
        title: payload.conversation?.contact_name ?? phone,
        status: 'active',
        metadata: { phone, kapso_conversation_id: payload.conversation?.id ?? null },
      })
      .select('id')
      .single()

    if (createError || !created) return
    conversationId = created.id
  }

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
  const isTextMessage = payload.message.type === 'text' && Boolean(payload.message.text?.body ?? payload.message.kapso?.content)

  if (leadId && isTextMessage && process.env.ANTHROPIC_API_KEY) {
    await runAiAgent(supabase, leadId, conversationId, insertedMessage.id, content)
  }
}

async function runAiAgent(
  supabase: ReturnType<typeof createAdminClient>,
  leadId: string,
  conversationId: string,
  triggerMessageId: string,
  newMessage: string
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
    .select('sender_type, content')
    .eq('conversation_id', conversationId)
    .neq('id', triggerMessageId)
    .order('created_at', { ascending: false })
    .limit(10)

  const history = (recentMessages ?? []).reverse().map((m) => ({ senderType: m.sender_type, content: m.content }))

  const leadContext = {
    firstName: lead.first_name,
    lastName: lead.last_name,
    currentTemperature,
    sudahSurvey: (metadata.sudah_survey as string | undefined) ?? null,
    minatUnitLokasi: (metadata.minat_unit_lokasi as string | undefined) ?? null,
    permintaan: (metadata.permintaan as string | undefined) ?? null,
    komentar: (metadata.komentar as string | undefined) ?? null,
  }

  const inputSnapshot = { leadContext, history, newMessage }

  const { decision, rawResponse, error } = await interpretLeadReply(leadContext, history, newMessage)

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
    leadPhone: lead.phone,
    assignedTo: lead.assigned_to,
    conversationId,
    triggerMessageId,
    currentMetadata: lead.metadata,
    currentTemperature,
    decision,
    inputSnapshot,
    rawResponse,
  })
}

export async function POST(request: Request) {
  const secret = process.env.KAPSO_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook belum dikonfigurasi' }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-webhook-signature')

  if (!verifySignature(rawBody, signature, secret)) {
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

  const supabase = createAdminClient()
  for (const payload of payloads) {
    await handleMessageReceived(supabase, payload)
  }

  return NextResponse.json({ success: true })
}
