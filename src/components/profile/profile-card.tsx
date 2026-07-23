"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ProfileField {
  label: string;
  value: string;
}

interface ProfileCardProps {
  title: string;
  fields: ProfileField[];
}

export function ProfileCard({ title, fields }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.label}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {field.label}
              </span>
              <span className="text-sm font-semibold">{field.value}</span>
            </div>
            {index < fields.length - 1 && (
              <Separator className="mt-3" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}