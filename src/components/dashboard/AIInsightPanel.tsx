// src/components/dashboard/AIInsightPanel.tsx
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Insight } from "@/types/dashboard";
import { PRIORITY } from "@/constants/dashboard";

interface AIInsightPanelProps {
  data: Insight[];
  error: boolean;
}

export function AIInsightPanel({ data, error }: AIInsightPanelProps) {
  if (error) {
    return (
      <SectionCard title="AI Intelligence" description="Behavioral insights and priority alerts">
        <EmptyState title="Error" description="Unable to load AI insights." />
      </SectionCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionCard title="AI Intelligence" description="Behavioral insights and priority alerts">
        <EmptyState title="No Insights" description="AI analysis is currently processing." />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="AI Intelligence" description="Behavioral insights and priority alerts">
      <div className="space-y-4">
        {data.map((insight, idx) => (
          <div key={idx} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{insight.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                insight.priority === PRIORITY.HIGH ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                insight.priority === PRIORITY.MEDIUM ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
                "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }`}>
                {insight.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}