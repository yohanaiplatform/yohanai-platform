// src/lib/dashboard/getDashboardInsights.ts

import type { Insight } from "@/types/dashboard";
import { PRIORITY } from "@/constants/dashboard";

export async function getDashboardInsights(): Promise<Insight[]> {
  const now = new Date().toISOString();

  return [
    {
      id: "insight-1",
      title: "Buyer Behavior Insight",
      description:
        "Lead #8821 viewed pricing page 3 times in the last hour, indicating high purchase intent.",
      category: "behavior",
      priority: PRIORITY.HIGH.toLowerCase() as "high",
      created_at: now,
    },
    {
      id: "insight-2",
      title: "Suggested Follow-up",
      description:
        "5 warm leads have not been contacted in the last 48 hours. Prioritize outreach.",
      category: "action",
      priority: PRIORITY.MEDIUM.toLowerCase() as "medium",
      created_at: now,
    },
    {
      id: "insight-3",
      title: "Priority Alert",
      description:
        "Competitor price drop detected in South Jakarta area for 3-bedroom properties.",
      category: "alert",
      priority: PRIORITY.HIGH.toLowerCase() as "high",
      created_at: now,
    },
  ];
}