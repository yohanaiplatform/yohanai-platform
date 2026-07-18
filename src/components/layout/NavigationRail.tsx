"use client";

import { useRouter, usePathname } from "next/navigation";
import { navigationConfig } from "@/config/navigation";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NavigationRail() {
  const pathname = usePathname();
  const router = useRouter();

  const mainItems = [
    navigationConfig.dashboard,
    navigationConfig.crm,
    navigationConfig.property,
    navigationConfig.sales,
    navigationConfig.reports,
    navigationConfig.settings,
  ];

  return (
    <TooltipProvider>
      <div className="hidden md:flex flex-col items-center w-16 border-r bg-background py-4 gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-2"
        >
          <LucideIcons.Sparkles className="h-6 w-6 text-primary" />
        </button>
        <div className="flex flex-col gap-2 w-full px-2">
          {mainItems.map((item) => {
            const Icon = LucideIcons[item.icon as keyof typeof LucideIcons] as React.ElementType;
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  className={cn(
                    "flex items-center justify-center p-2 rounded-lg transition-colors w-full",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="h-5 w-5" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.title}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}