// src/types/dashboard.ts

export type Priority = "HIGH" | "MEDIUM" | "LOW";

export interface DashboardStats {
  totalLeads: number;
  activeChats: number;
  totalProperties: number;
  todayLeads: number;
}

export interface RecentLead {
  id: string;
  name: string | null;
  status: string | null;
  agent: string | null;
  source: string | null;
  created_at: string | null;
}

export interface RecentChat {
  id: string;
  customer_name: string | null;
  status: string | null;
  last_message_at: string | null;
}

export interface LeadSummary {
  hot: number;
  warm: number;
  cold: number;
}

export interface PropertySummary {
  available: number;
  booked: number;
  sold: number;
  hold: number;
}

export interface Insight {
  title: string;
  description: string;
  priority: Priority;
  type: string;
}

/* -------------------------------------------------------------------------- */
/* New types used by Dashboard Service                                         */
/* -------------------------------------------------------------------------- */

export interface RecentActivity {
  id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  recentLeads: RecentLead[];
  recentActivities: RecentActivity[];
  notifications: Notification[];
}