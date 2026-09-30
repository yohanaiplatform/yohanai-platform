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
