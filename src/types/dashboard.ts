export interface DashboardStats {
  totalLeads: number;
  activeChats: number;
  totalProperties: number;
  todayLeads: number;
}

export interface RecentLead {
  id: string;
  name: string | null;
  email: string | null;
  source: string | null;
  agent: string | null;
  status: string | null;
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
  customer_name: string | null;
  status: string | null;
  last_message_at: string | null;
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