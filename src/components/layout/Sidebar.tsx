"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  MessageSquare,
  Share2,
  Settings,
  LogOut,
} from "lucide-react";

type SidebarProps = {
  isMobile?: boolean;
  onClose?: () => void;
};

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Sales", href: "/sales", icon: TrendingUp },
  { name: "Communication", href: "/communication", icon: MessageSquare },
  { name: "Social", href: "/social", icon: Share2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  isMobile = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-semibold">Yohan.AI</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (isMobile) {
                  onClose?.();
                }
              }}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}