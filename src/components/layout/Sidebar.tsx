"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

import { createClient } from "@/lib/supabase/client";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

type SidebarProps = {
  isMobile?: boolean;
  onClose?: () =>void;
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
  const router = useRouter();
  const supabase = createClient();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Logo variant="light" className="h-8" />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => isMobile && onClose?.()}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Logout"}
        </Button>
      </div>
    </aside>
  );
}