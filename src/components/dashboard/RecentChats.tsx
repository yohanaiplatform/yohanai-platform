// src/components/dashboard/RecentChats.tsx

import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { RecentChat } from "@/types/dashboard";

interface RecentChatsProps {
  data: RecentChat[] | null;
  error: boolean;
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const diffInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

  return date.toLocaleDateString();
}

export function RecentChats({ data, error }: RecentChatsProps) {
  if (error) {
    return (
      <SectionCard
        title="Recent Chats"
        description="Latest WhatsApp conversations"
      >
        <EmptyState
          title="Error"
          description="Unable to load conversations."
        />
      </SectionCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionCard
        title="Recent Chats"
        description="Latest WhatsApp conversations"
      >
        <EmptyState
          title="No Chats"
          description="No recent conversations found."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Recent Chats"
      description="Latest WhatsApp conversations"
    >
      <div className="space-y-4">
        {data.map((chat) => (
          <div
            key={chat.id}
            className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div>
              <p className="font-medium">
                {chat.title ?? "Untitled Conversation"}
              </p>

              <p className="text-sm text-muted-foreground">
                Last activity: {getRelativeTime(chat.updated_at)}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Lead ID: {chat.lead_id ?? "-"}
              </p>
            </div>

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                chat.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }`}
            >
              {chat.status}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}