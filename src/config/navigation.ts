export const navigationConfig = {
  dashboard: {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  communication: {
    title: "Communication",
    icon: "MessageSquare",
    items: [
      { title: "AI Inbox", href: "/communication/ai-inbox", icon: "Bot" },
      { title: "WhatsApp", href: "/communication/whatsapp", icon: "MessageCircle" },
      { title: "Messenger", href: "/communication/messenger", icon: "Send" },
      { title: "Instagram", href: "/communication/instagram", icon: "Instagram" },
    ],
  },
  crm: {
    title: "CRM",
    href: "/crm",
    icon: "Users",
  },
  property: {
    title: "Property",
    href: "/property",
    icon: "Building",
  },
  sales: {
    title: "Sales",
    href: "/sales",
    icon: "TrendingUp",
  },
  automation: {
    title: "Automation",
    href: "/automation",
    icon: "Zap",
  },
  knowledge: {
    title: "Knowledge",
    href: "/knowledge",
    icon: "BookOpen",
  },
  reports: {
    title: "Reports",
    href: "/reports",
    icon: "BarChart3",
  },
  settings: {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
  },
} as const;

export type NavigationConfig = typeof navigationConfig;