"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Breadcrumb } from "./Breadcrumb";
import { PageContainer } from "./PageContainer";
import { BottomNav } from "./BottomNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Desktop: Fixed Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-50">
        <Sidebar />
      </aside>

      {/* Tablet: Drawer Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar isMobile onClose={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:pl-64 w-full md:pb-0 pb-16">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        
        <main className="flex-1 flex flex-col">
          <div className="hidden md:block px-4 py-2 md:px-8 border-b bg-background">
            <Breadcrumb />
          </div>
          <PageContainer>
            {children}
          </PageContainer>
        </main>

        {/* Mobile: Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}