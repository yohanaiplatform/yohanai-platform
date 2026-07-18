import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { RecentLead, RecentActivity } from "@/types/dashboard";

export class DashboardRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getLeadCount(): Promise<number> {
    const { count, error } = await this.client
      .schema("customer")
      .from("leads")
      .select("id", { head: true, count: "exact" });

    if (error) {
      throw new Error(`Failed to fetch lead count: ${error.message}`);
    }

    return count ?? 0;
  }

  async getChatCount(): Promise<number> {
    const { count, error } = await this.client
      .schema("chat")
      .from("conversations")
      .select("id", { head: true, count: "exact" });

    if (error) {
      throw new Error(`Failed to fetch chat count: ${error.message}`);
    }

    return count ?? 0;
  }

  async getPropertyCount(): Promise<number> {
    const { count, error } = await this.client
      .schema("property")
      .from("listings")
      .select("id", { head: true, count: "exact" });

    if (error) {
      throw new Error(`Failed to fetch property count: ${error.message}`);
    }

    return count ?? 0;
  }

  async getTodayLeadCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await this.client
      .schema("customer")
      .from("leads")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", today.toISOString());

    if (error) {
      throw new Error(`Failed to fetch today's lead count: ${error.message}`);
    }

    return count ?? 0;
  }

  async getRecentLeads(): Promise<RecentLead[]> {
    const { data, error } = await this.client
      .schema("customer")
      .from("leads")
      .select("id, first_name, last_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`Failed to fetch recent leads: ${error.message}`);
    }

    return (data ?? []).map((lead) => ({
      id: lead.id,
      name:
        `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || null,
      status: lead.status ?? null,
      agent: null,
      source: null,
      created_at: lead.created_at,
    }));
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    // TODO: Replace with workflow/audit activity source when available.
    return [];
  }
}