"use client";

// src/components/property/PropertyAssignSelect.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AssignableUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role_name: string | null;
}

interface PropertyAssignSelectProps {
  listingId: string;
  assignedTo: string | null;
}

export function PropertyAssignSelect({ listingId, assignedTo }: PropertyAssignSelectProps) {
  const router = useRouter();
  // null = belum tahu (masih fetch daftar user). core.list_assignable_users()
  // balas array kosong kalau pemanggil bukan admin/super_admin -- itu sinyal
  // buat sembunyikan dropdown, bukan error. Pola sama seperti LeadAssignSelect.tsx.
  const [users, setUsers] = useState<AssignableUser[] | null>(null);
  const [value, setValue] = useState(assignedTo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const supabase = createClient();
      const { data } = await supabase.schema("core").rpc("list_assignable_users");
      if (active) setUsers(data ?? []);
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const prev = value;
    setValue(next);
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema("property")
      .from("listings")
      .update({ assigned_to: next || null })
      .eq("id", listingId);

    setSaving(false);

    if (updateError) {
      setValue(prev);
      setError("Gagal ubah penanggung jawab.");
      return;
    }

    router.refresh();
  }

  if (users === null) {
    return <span className="text-sm text-muted-foreground">Memuat...</span>;
  }

  // Bukan admin/super_admin -- RLS listings_owner_or_admin menjamin listing
  // yang bisa dilihat non-admin cuma miliknya sendiri, jadi cukup teks statis.
  if (users.length === 0) {
    return <span className="text-sm">Saya</span>;
  }

  return (
    <div className="space-y-1">
      <select
        value={value}
        onChange={handleChange}
        disabled={saving}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
      >
        <option value="">Belum ditugaskan</option>
        {users.map((u) => (
          <option key={u.user_id} value={u.user_id}>
            {u.display_name ?? u.email ?? u.user_id}
            {u.role_name ? ` (${u.role_name})` : ""}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
