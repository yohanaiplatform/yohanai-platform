import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/date";
import type { RecentActivity } from "@/types/dashboard";

interface RecentActivityListProps {
  activities: RecentActivity[] | undefined;
  loading?: boolean;
}

export function RecentActivityList({ activities, loading }: RecentActivityListProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Recent Activities</h3>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !activities || activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activities.</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <span className="text-sm font-medium">Activity</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(activity.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}