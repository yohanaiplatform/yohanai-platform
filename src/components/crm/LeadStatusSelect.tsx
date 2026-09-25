"use client";

// src/components/crm/LeadStatusSelect.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LEAD_STATUS_CONFIG } from "@/components/crm/lead-status-badge";
import type { CrmDictionary } from "@/lib/i18n/dictionaries";

interface LeadStatusSelectProps {
  leadId: string;
  status: string;
  t: CrmDictionary;
}

export function LeadStatusSelect({ leadId, status, t }: LeadStatusSelectProps) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const prev = value;
    setValue(next);
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema("customer")
      .from("leads")
      .update({ status: next })
      .eq("id", leadId);

    setSaving(false);

    if (updateError) {
      setValue(prev);
      setError(t.detail.saveError);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-1">
      <select
        value={value}
        onChange={handleChange}
        disabled={saving}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
      >
        {Object.keys(LEAD_STATUS_CONFIG).map((statusKey) => (
          <option key={statusKey} value={statusKey}>
            {t.status[statusKey as keyof typeof t.status] ?? statusKey}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
