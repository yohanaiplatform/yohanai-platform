"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { SearchCommand } from "./SearchCommand";
import { NotificationMenu } from "./NotificationMenu";
import { UserMenu } from "./UserMenu";
import { LanguageToggle } from "./LanguageToggle";
import type { Locale } from "@/lib/i18n/dictionaries";

interface HeaderProps {
  onMenuClick?: () => void;
  initialLocale: Locale;
}

export function Header({ onMenuClick, initialLocale }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6">
      <div className="flex shrink-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <Logo variant="light" className="h-8" />
      </div>

      <div className="mx-3 min-w-0 flex-1 md:mx-6">
        <SearchCommand />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <LanguageToggle initialLocale={initialLocale} />
        <NotificationMenu />
        <UserMenu />
      </div>
    </header>
  );
}