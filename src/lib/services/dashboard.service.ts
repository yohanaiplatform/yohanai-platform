import { createClient } from "@/lib/supabase/client";
import { DashboardRepository } from "@/lib/repositories/dashboard.repository";
import type { DashboardData } from "@/types/dashboard";

export class DashboardService {
  private readonly repository: DashboardRepository;

  constructor() {
    const client = createClient();
    this.repository = new DashboardRepository(client);
  }

  async getDashboardData(): Promise<DashboardData> {
    const [
      totalLeads,
      activeChats,
      totalProperties,
      todayLeads,
      recentLeads,
      recentActivities,
      leadSummary,
      propertySummary,
      recentChats,
      insights,
    ] = await Promise.all([
      this.repository.getLeadCount(),
      this.repository.getChatCount(),
      this.repository.getPropertyCount(),
      this.repository.getTodayLeadCount(),
      this.repository.getRecentLeads(),
      this.repository.getRecentActivities(),
      this.repository.getLeadSummary(),
      this.repository.getPropertySummary(),
      this.repository.getRecentChats(),
      this.repository.getInsights(),
    ]);

    return {
      stats: { totalLeads, activeChats, totalProperties, todayLeads },
      recentLeads,
      recentActivities,
      notifications: [],
      leadSummary,
      propertySummary,
      recentChats,
      insights,
    };
  }
}

export const dashboardService = new DashboardService();