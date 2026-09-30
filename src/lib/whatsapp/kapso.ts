// src/lib/whatsapp/kapso.ts

const KAPSO_API_BASE = "https://api.kapso.ai/meta/whatsapp/v24.0";

interface SendTextResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/** Kirim pesan teks WhatsApp lewat Kapso (WhatsApp Cloud API resmi Meta). */
export async function sendWhatsAppText(to: string, body: string): Promise<SendTextResult> {
  const apiKey = process.env.KAPSO_API_KEY;
  const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    return {
      success: false,
      error: "Kapso belum dikonfigurasi (KAPSO_API_KEY/KAPSO_PHONE_NUMBER_ID)",
    };
  }

  const res = await fetch(`${KAPSO_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    return { success: false, error: errorBody };
  }

  const json = await res.json();
  const messageId = json?.messages?.[0]?.id as string | undefined;

  return { success: true, messageId };
}

interface SimpleResult {
  success: boolean;
  error?: string;
}

/**
 * Tandai pesan masuk sebagai sudah dibaca + tampilkan indikator "sedang
 * mengetik..." di WhatsApp lead -- dipanggil begitu webhook terima pesan
 * yang bakal diproses AI Agent, supaya lead tahu ada proses berjalan
 * (bukan didiamkan) selama Claude API dipanggil. Indikator otomatis hilang
 * dari sisi Meta/WhatsApp setelah ~25 detik atau begitu balasan terkirim
 * -- dikonfirmasi ke docs.kapso.ai/api/meta/whatsapp/messages/send-a-message.
 */
export async function sendTypingIndicator(waMessageId: string): Promise<SimpleResult> {
  const apiKey = process.env.KAPSO_API_KEY;
  const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    return { success: false, error: "Kapso belum dikonfigurasi (KAPSO_API_KEY/KAPSO_PHONE_NUMBER_ID)" };
  }

  const res = await fetch(`${KAPSO_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: waMessageId,
      typing_indicator: { type: "text" },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    return { success: false, error: errorBody };
  }

  return { success: true };
}

/** Kirim foto WhatsApp lewat Kapso pakai URL publik (R2), tanpa upload dulu -- format sama seperti dokumentasi Meta Cloud API (docs/modules/ai.mdx). */
export async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption?: string
): Promise<SendTextResult> {
  const apiKey = process.env.KAPSO_API_KEY;
  const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    return {
      success: false,
      error: "Kapso belum dikonfigurasi (KAPSO_API_KEY/KAPSO_PHONE_NUMBER_ID)",
    };
  }

  const res = await fetch(`${KAPSO_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: caption ? { link: imageUrl, caption } : { link: imageUrl },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    return { success: false, error: errorBody };
  }

  const json = await res.json();
  const messageId = json?.messages?.[0]?.id as string | undefined;

  return { success: true, messageId };
}
