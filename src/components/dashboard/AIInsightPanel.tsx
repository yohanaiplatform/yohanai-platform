// src/components/dashboard/AIInsightPanel.tsx

import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Insight } from "@/types/dashboard";

interface AIInsightPanelProps {
  data: Insight[];
  error: boolean;
}

export function AIInsightPanel({ data, error }: AIInsightPanelProps) {
  if (error) {
    return (
      <SectionCard
        title="AI Intelligence"
        description="Behavioral insights and priority alerts"
      >
        <EmptyState
          title="Error"
          description="Unable to load AI insights."
        />
      </SectionCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionCard
        title="AI Intelligence"
        description="Behavioral insights and priority alerts"
      >
        <EmptyState
          title="No Insights"
          description="AI analysis is currently processing."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="AI Intelligence"
      description="Behavioral insights and priority alerts"
    >
      <div className="space-y-4">
        {data.map((insight) => {
          const badgeClass =
            insight.priority === "high"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              : insight.priority === "medium"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";

          return (
            <div
              key={insight.id}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold">{insight.title}</h4>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {insight.description}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {insight.category} •{" "}
                    {new Date(insight.created_at).toLocaleString()}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${badgeClass}`}
                >
                  {insight.priority.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}