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
    ] = await Promise.all([
      this.repository.getLeadCount(),
      this.repository.getChatCount(),
      this.repository.getPropertyCount(),
      this.repository.getTodayLeadCount(),
      this.repository.getRecentLeads(),
      this.repository.getRecentActivities(),
    ]);

    return {
      stats: { totalLeads, activeChats, totalProperties, todayLeads },
      recentLeads,
      recentActivities,
      notifications: [],
    };
  }
}

// Singleton instance — reused across the application
export const dashboardService = new DashboardService();