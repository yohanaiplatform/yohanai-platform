"use client";

// src/components/settings/PlatformAccessManager.tsx

import { useCallback, useEffect, useState } from "react";

interface AccessUser {
  userId: string;
  email: string;
  name: string | null;
  enabled: boolean;
}

/**
 * Admin memberi/mencabut penanda "boleh melihat laporan & dashboard platform" per akun non-admin. Akun bertanda menerima
 * Platform Report (email) dan bisa membuka Master Admin, tetapi tetap hanya melihat lead/listing miliknya sendiri.
 */
export function PlatformAccessManager() {
  const [users, setUsers] = useState<AccessUser[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/platform-access", { cache: "no-store" });
      if (res.ok) setUsers((await res.json()).users);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function toggle(user: AccessUser) {
    setBusyId(user.userId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/platform-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, enabled: !user.enabled }),
      });
      if (!res.ok) setMessage("Gagal menyimpan.");
      else setUsers((prev) => (prev ?? []).map((u) => (u.userId === user.userId ? { ...u, enabled: !u.enabled } : u)));
    } catch {
      setMessage("Gagal menyimpan.");
    }
    setBusyId(null);
  }

  if (users === null) return <p className="text-sm text-muted-foreground">Memuat...</p>;
  if (users.length === 0) return <p className="text-sm text-muted-foreground">Belum ada akun non-admin.</p>;

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border rounded-md border border-border">
        {users.map((u) => (
          <li key={u.userId} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium">{u.name ?? u.email}</div>
              {u.name && <div className="truncate text-xs text-muted-foreground">{u.email}</div>}
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={u.enabled} disabled={busyId === u.userId} onChange={() => toggle(u)} />
              Terima laporan &amp; lihat Master Admin
            </label>
          </li>
        ))}
      </ul>
      {message && <p className="text-sm text-destructive">{message}</p>}
      <p className="text-xs text-muted-foreground">
        Akun yang dicentang menerima Platform Report lewat email dan bisa membuka halaman Master Admin, tetapi tetap hanya melihat lead dan
        listing miliknya sendiri (bukan peran admin penuh).
      </p>
    </div>
  );
}
