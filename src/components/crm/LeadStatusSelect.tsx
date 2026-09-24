"use client";

// src/components/crm/LeadStatusSelect.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LEAD_STATUS_CONFIG } from "@/components/crm/lead-status-badge";

interface LeadStatusSelectProps {
  leadId: string;
  status: string;
}

export function LeadStatusSelect({ leadId, status }: LeadStatusSelectProps) {
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
      setError("Gagal menyimpan status. Coba lagi.");
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
        {Object.entries(LEAD_STATUS_CONFIG).map(([statusKey, config]) => (
          <option key={statusKey} value={statusKey}>
            {config.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
