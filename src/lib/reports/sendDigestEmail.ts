// src/lib/reports/sendDigestEmail.ts

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Format WhatsApp ringan (*tebal*) -> HTML sederhana, setelah teks di-escape. */
function waToHtml(line: string): string {
  return escapeHtml(line).replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>");
}

/**
 * Kirim Rangkuman chat lewat email -- jalur yang andal. WhatsApp teks bebas ke nomor pribadi agen HANYA sampai kalau
 * agen mengirim pesan ke nomor bisnis dalam 24 jam terakhir (aturan Meta) dan kegagalannya tidak terlihat dari sisi API,
 * jadi rangkuman 3x sehari sering hilang (ketemu 9 Okt 2026). Email tidak punya batasan itu.
 */
export async function sendDigestEmail(
  to: string,
  subject: string,
  lines: string[]
): Promise<{ error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { error: "RESEND_API_KEY/RESEND_FROM_EMAIL belum dikonfigurasi." };

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;line-height:1.5;">${lines
    .map((l) => (l.trim() === "" ? "<br/>" : `<div>${waToHtml(l)}</div>`))
    .join("")}</div>`;
  const text = lines.join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) return { error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengirim email" };
  }
}
