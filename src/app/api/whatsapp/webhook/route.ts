// src/app/api/whatsapp/webhook/route.ts

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/crm/normalizePhone'
import { findOrCreateLeadConversation } from '@/lib/chat/conversations'

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

  const { error: insertError } = await supabase
    .schema('chat')
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'customer',
      content,
      metadata: {
        wa_message_id: waMessageId,
        message_type: payload.message.type,
        has_media: payload.message.kapso?.has_media ?? false,
      },
    })

  if (insertError) return

  // Sentuh baris conversation supaya trigger core.update_updated_at_column
  // membangunkan updated_at -- Recent Chats di dashboard urut berdasarkan itu.
  await supabase
    .schema('chat')
    .from('conversations')
    .update({ status: 'active' })
    .eq('id', conversationId)
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
