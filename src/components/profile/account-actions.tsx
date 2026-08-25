"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ActionItem {
  label: string;
  description: string;
  href?: string;
}

const actions: ActionItem[] = [
  {
    label: "Edit Profile",
    description: "Update your personal information and preferences.",
  },
  {
    label: "Change Password",
    description: "Update your account password for better security.",
    href: "/change-password",
  },
  {
    label: "Notification Preferences",
    description: "Manage how and when you receive notifications.",
    href: "/notification-preferences",
  },
];

export function AccountActions() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account Actions</CardTitle>
        <CardDescription>
          Manage your account settings. These features will be available in
          upcoming sprints.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action) => (
          <div
            key={action.label}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground">
                {action.description}
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0"
              disabled={!action.href}
              onClick={action.href ? () => router.push(action.href!) : undefined}
            >
              {action.label}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}