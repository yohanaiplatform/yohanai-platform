// src/components/crm/LeadDetailField.tsx

import type { ReactNode } from "react";

interface LeadDetailFieldProps {
  label: string;
  value?: ReactNode;
}

export function LeadDetailField({ label, value }: LeadDetailFieldProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value || <span className="text-muted-foreground">-</span>}</div>
    </div>
  );
}
