export interface DashboardStats {
  totalLeads: number;
  activeChats: number;
  totalProperties: number;
  todayLeads: number;
}

export interface RecentLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  lead_source_id: string | null;
  status: string;
  created_at: string;
}

export interface RecentActivity {
  id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
}

export interface LeadSummary {
  total: number;
  newToday: number;
  conversionRate: number;
  activeFollowUps: number;
  hot: number;
  warm: number;
  cold: number;
}

export interface PropertySummary {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  booked: number;
  hold: number;
}

export interface RecentChat {
  id: string;
  lead_id: string | null;
  title: string | null;
  status: string;
  unreadCount: number;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  created_at: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentLeads: RecentLead[];
  recentActivities: RecentActivity[];
  notifications: Notification[];
  leadSummary: LeadSummary;
  propertySummary: PropertySummary;
  recentChats: RecentChat[];
  insights: Insight[];
}