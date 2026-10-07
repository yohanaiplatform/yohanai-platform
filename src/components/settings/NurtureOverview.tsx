// src/components/settings/NurtureOverview.tsx

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FOLLOW_UP_TEMPLATES } from "@/lib/whatsapp/followUpTemplates";

const DAYS = 30;

function sinceIso(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

const dateTime = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/**
 * Template WhatsApp yang tersedia + riwayat follow-up otomatis 30 hari terakhir untuk lead milik akun ini
 * (admin melihat semua). Server component; data dibaca lewat service_role karena schema `ai` tertutup untuk browser.
 */
export async function NurtureOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin } = await supabase.schema("core").rpc("is_admin_or_above");
  const admin = createAdminClient();
  const since = sinceIso(DAYS);

  const { data: sends } = await admin
    .schema("ai")
    .from("nurture_sends")
    .select("lead_id, step, template_name, status, error, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  const leadIds = Array.from(new Set((sends ?? []).map((s) => s.lead_id)));
  let leadQuery = admin.schema("customer").from("leads").select("id, first_name, last_name, assigned_to").in("id", leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"]);
  if (!isAdmin) leadQuery = leadQuery.eq("assigned_to", user.id);
  const { data: leads } = await leadQuery;
  const leadById = new Map((leads ?? []).map((l) => [l.id, l]));

  const mine = (sends ?? []).filter((s) => leadById.has(s.lead_id));
  const sentByTemplate = new Map<string, number>();
  for (const s of mine) if (s.status === "sent") sentByTemplate.set(s.template_name, (sentByTemplate.get(s.template_name) ?? 0) + 1);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Template WhatsApp tersedia</h3>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Template</th>
                <th className="px-3 py-2">Bahasa</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Terkirim otomatis ({DAYS} hari)</th>
              </tr>
            </thead>
            <tbody>
              {FOLLOW_UP_TEMPLATES.map((t) => (
                <tr key={t.name} className="border-t border-border">
                  <td className="px-3 py-2">{t.label}</td>
                  <td className="px-3 py-2">{t.language}</td>
                  <td className="px-3 py-2">Disetujui</td>
                  <td className="px-3 py-2 text-right">{sentByTemplate.get(t.name) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Template yang sama juga bisa dikirim manual dari halaman lead lewat tombol &quot;Kirim Template Follow-up&quot;. Template baru
          didaftarkan setelah disetujui Meta.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Riwayat follow-up otomatis (terbaru)</h3>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada follow-up otomatis dalam {DAYS} hari terakhir.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Waktu (WIB)</th>
                  <th className="px-3 py-2">Lead</th>
                  <th className="px-3 py-2">Langkah</th>
                  <th className="px-3 py-2">Template</th>
                  <th className="px-3 py-2">Hasil</th>
                </tr>
              </thead>
              <tbody>
                {mine.slice(0, 20).map((s, i) => {
                  const lead = leadById.get(s.lead_id);
                  return (
                    <tr key={`${s.lead_id}-${i}`} className="border-t border-border">
                      <td className="whitespace-nowrap px-3 py-2">{dateTime.format(new Date(s.created_at))}</td>
                      <td className="px-3 py-2">{[lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || "(tanpa nama)"}</td>
                      <td className="px-3 py-2">{s.step}</td>
                      <td className="px-3 py-2">{s.template_name}</td>
                      <td className="px-3 py-2">{s.status === "sent" ? "Terkirim" : `Gagal${s.error ? `: ${s.error.slice(0, 60)}` : ""}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
