"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { SearchCommand } from "./SearchCommand";
import { NotificationMenu } from "./NotificationMenu";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
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

      <div className="mx-6 flex-1">
        <SearchCommand />
      </div>

      <div className="flex items-center gap-2">
        <NotificationMenu />
        <UserMenu />
      </div>
    </header>
  );
}