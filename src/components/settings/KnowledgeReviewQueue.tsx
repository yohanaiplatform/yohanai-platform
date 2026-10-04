// src/components/settings/KnowledgeReviewQueue.tsx

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isKnowledgeCurator } from "@/lib/knowledge/curator";
import { SectionCard } from "@/components/ui/section-card";
import { KnowledgeReviewList, type PendingEntry, type PendingPlace } from "@/components/settings/KnowledgeReviewList";

/** Antrean usulan pengetahuan/titik peta dari user lain -- hanya tampil untuk kurator (server component). */
export async function KnowledgeReviewQueue() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  if (!(await isKnowledgeCurator(admin, user.id))) return null;

  const [{ data: entries }, { data: places }] = await Promise.all([
    admin.schema("knowledge").from("entries").select("id, title, content, keywords, submitted_by").eq("review_status", "pending").order("created_at"),
    admin.schema("knowledge").from("places").select("id, name, aliases, lat, lng, maps_url, submitted_by").eq("review_status", "pending").order("created_at"),
  ]);

  const submitterIds = Array.from(
    new Set([...(entries ?? []), ...(places ?? [])].map((row) => row.submitted_by).filter((id): id is string => Boolean(id)))
  );
  const { data: profiles } = submitterIds.length
    ? await admin.schema("auth_ext").from("profiles").select("user_id, first_name, last_name").in("user_id", submitterIds)
    : { data: [] as { user_id: string; first_name: string | null; last_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.user_id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || null]));

  const pendingEntries: PendingEntry[] = (entries ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    content: e.content,
    keywords: e.keywords,
    submittedBy: e.submitted_by ? nameById.get(e.submitted_by) ?? "Pengguna lain" : "Pengguna lain",
  }));
  const pendingPlaces: PendingPlace[] = (places ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    aliases: p.aliases,
    lat: p.lat,
    lng: p.lng,
    mapsUrl: p.maps_url,
    submittedBy: p.submitted_by ? nameById.get(p.submitted_by) ?? "Pengguna lain" : "Pengguna lain",
  }));

  return (
    <SectionCard
      title="Menunggu Persetujuan Kurator"
      description="Usulan pengetahuan dan titik peta dari pengguna lain. Hanya yang Anda setujui yang dipakai asisten."
    >
      <KnowledgeReviewList entries={pendingEntries} places={pendingPlaces} />
    </SectionCard>
  );
}
