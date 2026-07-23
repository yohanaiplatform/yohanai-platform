"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileHeaderProps {
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  avatarUrl?: string;
}

export function ProfileHeader({
  name,
  email,
  role,
  status,
  avatarUrl,
}: ProfileHeaderProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6 sm:flex-row sm:items-start sm:gap-6">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="text-2xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
            <Badge
              variant={status === "active" ? "default" : "secondary"}
              className="capitalize"
            >
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{email}</p>
          <Badge variant="outline" className="mt-1 capitalize">
            {role}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}