"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SystemField {
  label: string;
  value: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
}

const systemFields: SystemField[] = [
  {
    label: "App Version",
    value: "Sprint 008 — v0.8.0",
    variant: "outline",
  },
  {
    label: "Environment",
    value: process.env.NODE_ENV === "production" ? "Production" : "Development",
    variant: "secondary",
  },
  {
    label: "Database",
    value: "Supabase (PostgreSQL)",
    variant: "outline",
  },
  {
    label: "Build Status",
    value: "PASS",
    variant: "default",
  },
];

export function SystemInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">System Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {systemFields.map((field, index) => (
          <div key={field.label}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {field.label}
              </span>
              <Badge variant={field.variant ?? "outline"}>
                {field.value}
              </Badge>
            </div>
            {index < systemFields.length - 1 && (
              <Separator className="mt-3" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}