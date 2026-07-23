import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  RecentLead,
  RecentActivity,
  LeadSummary,
  PropertySummary,
  RecentChat,
  Insight,
} from "@/types/dashboard";

export class DashboardRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getLeadCount(): Promise<number> {
    const { count, error } = await this.client
      .schema("customer")
      .from("leads")
      .select("id", { head: true, count: "exact" });
    if (error) throw new Error(`Failed to fetch lead count: ${error.message}`);
    return count ?? 0;
  }

  async getChatCount(): Promise<number> {
    const { count, error } = await this.client
      .schema("chat")
      .from("conversations")
      .select("id", { head: true, count: "exact" });
    if (error) throw new Error(`Failed to fetch chat count: ${error.message}`);
    return count ?? 0;
  }

  async getPropertyCount(): Promise<number> {
    const { count, error } = await this.client
      .schema("property")
      .from("listings")
      .select("id", { head: true, count: "exact" });
    if (error) throw new Error(`Failed to fetch property count: ${error.message}`);
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
    if (error) throw new Error(`Failed to fetch today's lead count: ${error.message}`);
    return count ?? 0;
  }

  async getRecentLeads(): Promise<RecentLead[]> {
    const { data, error } = await this.client
      .schema("customer")
      .from("leads")
      .select("id, name, email, source, agent, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(`Failed to fetch recent leads: ${error.message}`);
    return data ?? [];
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    return [];
  }

  async getLeadSummary(): Promise<LeadSummary> {
    return {
      total: 0,
      newToday: 0,
      conversionRate: 0,
      activeFollowUps: 0,
      hot: 0,
      warm: 0,
      cold: 0,
    };
  }

  async getPropertySummary(): Promise<PropertySummary> {
    return {
      total: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      booked: 0,
      hold: 0,
    };
  }

  async getRecentChats(): Promise<RecentChat[]> {
    const { data, error } = await this.client
      .schema("chat")
      .from("conversations")
      .select("id, customer_name, status, last_message_at, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(`Failed to fetch recent chats: ${error.message}`);
    return (data ?? []).map((chat) => ({
      ...chat,
      unreadCount: 0,
    }));
  }

  async getInsights(): Promise<Insight[]> {
    return [];
  }
}