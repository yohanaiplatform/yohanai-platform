// src/lib/dashboard/getDashboardInsights.ts
import { Insight } from "@/types/dashboard";
import { PRIORITY } from "@/constants/dashboard";

export async function getDashboardInsights(): Promise<Insight[]> {
  return [
    {
      title: "Buyer Behavior Insight",
      description: "Lead #8821 viewed pricing page 3 times in the last hour, indicating high purchase intent.",
      priority: PRIORITY.HIGH,
      type: "behavior",
    },
    {
      title: "Suggested Follow-up",
      description: "5 warm leads have not been contacted in the last 48 hours. Prioritize outreach.",
      priority: PRIORITY.MEDIUM,
      type: "action",
    },
    {
      title: "Priority Alert",
      description: "Competitor price drop detected in South Jakarta area for 3-bedroom properties.",
      priority: PRIORITY.HIGH,
      type: "alert",
    },
  ];
}