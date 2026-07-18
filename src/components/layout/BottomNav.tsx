"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    { title: "Home", href: "/dashboard", icon: "LayoutDashboard" },
    { title: "CRM", href: "/crm", icon: "Users" },
    { title: "Sales", href: "/sales", icon: "TrendingUp" },
    { title: "Settings", href: "/settings", icon: "Settings" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-6">
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const Icon = LucideIcons[item.icon as keyof typeof LucideIcons] as React.ElementType;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}