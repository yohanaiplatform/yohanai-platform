// src/app/(dashboard)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { getDashboardStats } from "@/lib/dashboard/getDashboardStats";
import { getRecentLeads } from "@/lib/dashboard/getRecentLeads";
import { getRecentChats } from "@/lib/dashboard/getRecentChats";
import { getLeadSummary } from "@/lib/dashboard/getLeadSummary";
import { getPropertySummary } from "@/lib/dashboard/getPropertySummary";
import { getDashboardInsights } from "@/lib/dashboard/getDashboardInsights";

import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { RecentChats } from "@/components/dashboard/RecentChats";
import { LeadFunnel } from "@/components/dashboard/LeadFunnel";
import { PropertySummary } from "@/components/dashboard/PropertySummary";
import { AIInsightPanel } from "@/components/dashboard/AIInsightPanel";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    stats,
    recentLeadsRes,
    recentChatsRes,
    leadSummary,
    propertySummary,
    insights
  ] = await Promise.all([
    getDashboardStats(supabase),
    getRecentLeads(supabase),
    getRecentChats(supabase),
    getLeadSummary(supabase),
    getPropertySummary(supabase),
    getDashboardInsights(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Executive Intelligence Dashboard</h1>
        <p className="text-muted-foreground">Property Buyer Behavior Intelligence System</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Leads" value={stats.totalLeads.toString()} description="Total active leads in the system" />
        <StatCard title="Active Chats" value={stats.activeChats.toString()} description="Ongoing WhatsApp conversations" />
        <StatCard title="Properties" value={stats.totalProperties.toString()} description="Total property listings" />
        <StatCard title="Today's New Leads" value={stats.todayLeads.toString()} description="Leads generated today" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentLeads data={recentLeadsRes.data} error={recentLeadsRes.error} />
        <RecentChats data={recentChatsRes.data} error={recentChatsRes.error} />
      </div>

      <AIInsightPanel data={insights} error={false} />

      <div className="grid gap-6 md:grid-cols-2">
        <PropertySummary data={propertySummary} />
        <LeadFunnel data={leadSummary} />
      </div>

      <SectionCard title="Quick Actions" description="Frequently used operations">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link href="/properties">
            <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2">
              <span className="text-base font-semibold">Import Listing</span>
            </Button>
          </Link>
          <Link href="/crm">
            <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2">
              <span className="text-base font-semibold">Add Lead</span>
            </Button>
          </Link>
          <Link href="/crm">
            <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2">
              <span className="text-base font-semibold">Open CRM</span>
            </Button>
          </Link>
          <Link href="/sales">
            <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2">
              <span className="text-base font-semibold">View Reports</span>
            </Button>
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}