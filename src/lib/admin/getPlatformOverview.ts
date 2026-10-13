// src/lib/admin/getPlatformOverview.ts
//
// Angka ringkasan "seluruh platform" untuk halaman Master Admin / laporan cetak (dibaca investor atau pihak luar):
// sebaran Temperature lead, listing, volume percakapan WhatsApp, pemakaian AI sepanjang waktu, basis pengetahuan, pengguna.
// Semua dihitung dari data nyata (count query), tidak ada angka karangan. Wajib service-role.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface PlatformOverview {
  leads: { total: number; hot: number; warm: number; cold: number; closing: number; batal: number };
  listings: { total: number; available: number; booked: number; sold: number; hold: number };
  chat: {
    conversations: number;
    messagesTotal: number;
    messagesCustomer: number;
    messages30d: number;
    customer30d: number;
    aiRunsTotal: number;
    aiRuns30d: number;
  };
  knowledge: { entries: number; places: number };
  users: number;
  firstLeadDate: string | null;
}

export async function getPlatformOverview(admin: SupabaseClient<Database>, now = Date.now()): Promise<PlatformOverview> {
  const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const leadCount = (status?: string) => {
    let q = admin.schema("customer").from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null);
    if (status) q = q.ilike("metadata->>status_funnel_awal", status);
    return q;
  };
  const msgCount = () => admin.schema("chat").from("messages").select("id", { count: "exact", head: true }).is("deleted_at", null);
  const listingCount = (status?: string) => {
    let q = admin.schema("property").from("listings").select("id", { count: "exact", head: true }).is("deleted_at", null);
    if (status) q = q.eq("metadata->>status", status);
    return q;
  };

  const [
    leadsTotal, hot, warm, cold, closing, batal,
    lTotal, lAvail, lBooked, lSold, lHold,
    conversations, msgsTotal, msgsCustomer, msgs30, msgsCustomer30,
    aiRunsTotal, aiRuns30,
    kEntries, kPlaces, users, firstLead,
  ] = await Promise.all([
    leadCount(), leadCount("hot"), leadCount("warm"), leadCount("cold"), leadCount("closing"), leadCount("batal"),
    listingCount(), listingCount("available"), listingCount("booked"), listingCount("sold"), listingCount("hold"),
    admin.schema("chat").from("conversations").select("id", { count: "exact", head: true }),
    msgCount(),
    msgCount().eq("sender_type", "customer"),
    msgCount().gte("created_at", since30),
    msgCount().eq("sender_type", "customer").gte("created_at", since30),
    admin.schema("ai").from("agent_runs").select("id", { count: "exact", head: true }).eq("status", "success"),
    admin.schema("ai").from("agent_runs").select("id", { count: "exact", head: true }).eq("status", "success").gte("created_at", since30),
    admin.schema("knowledge").from("entries").select("id", { count: "exact", head: true }).eq("review_status", "approved"),
    admin.schema("knowledge").from("places").select("id", { count: "exact", head: true }).eq("review_status", "approved"),
    admin.schema("auth_ext").from("profiles").select("id", { count: "exact", head: true }),
    admin.schema("customer").from("leads").select("created_at").is("deleted_at", null).order("created_at").limit(1),
  ]);

  const c = (r: { count: number | null }) => r.count ?? 0;
  return {
    leads: { total: c(leadsTotal), hot: c(hot), warm: c(warm), cold: c(cold), closing: c(closing), batal: c(batal) },
    listings: { total: c(lTotal), available: c(lAvail), booked: c(lBooked), sold: c(lSold), hold: c(lHold) },
    chat: {
      conversations: c(conversations),
      messagesTotal: c(msgsTotal),
      messagesCustomer: c(msgsCustomer),
      messages30d: c(msgs30),
      customer30d: c(msgsCustomer30),
      aiRunsTotal: c(aiRunsTotal),
      aiRuns30d: c(aiRuns30),
    },
    knowledge: { entries: c(kEntries), places: c(kPlaces) },
    users: c(users),
    firstLeadDate: (firstLead.data?.[0]?.created_at as string | undefined) ?? null,
  };
}
