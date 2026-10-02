"use client";

// src/components/settings/WhatsAppNumbersManager.tsx

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AssignableUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role_name: string | null;
}

interface WhatsappNumberRow {
  id: string;
  phone_number_id: string;
  label: string | null;
  assigned_to: string;
}

function userLabel(users: AssignableUser[], userId: string): string {
  const u = users.find((x) => x.user_id === userId);
  if (!u) return userId;
  return u.display_name ?? u.email ?? userId;
}

/**
 * Kelola pemetaan nomor WhatsApp (Kapso phone_number_id) -> pemilik default
 * lead baru dari nomor itu (chat.whatsapp_numbers, migration 056) --
 * persiapan multi-agent/SaaS: tiap agent yang sambungkan nomor WA sendiri
 * tinggal didaftarkan di sini, tanpa ubah kode/env var/redeploy.
 *
 * Admin-only -- RLS tabel ini (057) sudah batasi non-admin cuma lihat
 * barisnya sendiri, tapi UI kelola (tambah/ubah/hapus) sengaja disembunyikan
 * total dari non-admin, pola sama seperti PropertyConfidentialFields.tsx
 * (deteksi admin lewat core.list_assignable_users() -- array kosong = bukan
 * admin).
 */
export function WhatsAppNumbersManager() {
  const [users, setUsers] = useState<AssignableUser[] | null>(null);
  const [rows, setRows] = useState<WhatsappNumberRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newPhoneNumberId, setNewPhoneNumberId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [adding, setAdding] = useState(false);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .schema("chat")
      .from("whatsapp_numbers")
      .select("id, phone_number_id, label, assigned_to")
      .order("created_at", { ascending: true });
    setRows(data ?? []);
  }

  useEffect(() => {
    let active = true;

    (async () => {
      const supabase = createClient();
      const [{ data: assignable }, { data: numbers }] = await Promise.all([
        supabase.schema("core").rpc("list_assignable_users"),
        supabase
          .schema("chat")
          .from("whatsapp_numbers")
          .select("id, phone_number_id, label, assigned_to")
          .order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setUsers(assignable ?? []);
      setRows(numbers ?? []);
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleAdd() {
    if (!newPhoneNumberId.trim() || !newAssignedTo) {
      setError("Phone Number ID dan Pemilik wajib diisi.");
      return;
    }

    setAdding(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .schema("chat")
      .from("whatsapp_numbers")
      .insert({
        phone_number_id: newPhoneNumberId.trim(),
        label: newLabel.trim() || null,
        assigned_to: newAssignedTo,
      });

    setAdding(false);

    if (insertError) {
      setError("Gagal menambah nomor (mungkin Phone Number ID sudah terdaftar).");
      return;
    }

    setNewPhoneNumberId("");
    setNewLabel("");
    setNewAssignedTo("");
    refresh();
  }

  async function handleChangeAssignee(rowId: string, userId: string) {
    const supabase = createClient();
    await supabase.schema("chat").from("whatsapp_numbers").update({ assigned_to: userId }).eq("id", rowId);
    refresh();
  }

  async function handleDelete(rowId: string, phoneNumberId: string) {
    if (!window.confirm(`Hapus pemetaan nomor "${phoneNumberId}"? Lead baru dari nomor ini tidak akan otomatis dibuat lagi sampai didaftarkan ulang.`)) {
      return;
    }
    const supabase = createClient();
    await supabase.schema("chat").from("whatsapp_numbers").delete().eq("id", rowId);
    refresh();
  }

  // Masih memuat, atau bukan admin (array kosong) -- sembunyikan total.
  if (users === null || rows === null) {
    return <p className="text-sm text-muted-foreground">Memuat...</p>;
  }
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tiap nomor WhatsApp (Kapso Phone Number ID) perlu didaftarkan di sini supaya pesan masuk dari nomor itu
        otomatis jadi lead baru dengan pemilik yang benar, dan balasan terkirim dari nomor yang sesuai.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada nomor terdaftar.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.label || "(tanpa label)"}</p>
                <p className="truncate text-xs text-muted-foreground">{row.phone_number_id}</p>
              </div>
              <select
                value={row.assigned_to}
                onChange={(e) => handleChangeAssignee(row.id, e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.display_name ?? u.email ?? u.user_id}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(row.id, row.phone_number_id)}>
                Hapus
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium">Daftarkan Nomor Baru</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="new-phone-number-id">Phone Number ID (Kapso)</Label>
            <Input
              id="new-phone-number-id"
              value={newPhoneNumberId}
              onChange={(e) => setNewPhoneNumberId(e.target.value)}
              placeholder="mis. 1007716855765820"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-label">Label (opsional)</Label>
            <Input
              id="new-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="mis. Nomor Ramlan"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-assigned-to">Pemilik</Label>
            <select
              id="new-assigned-to"
              value={newAssignedTo}
              onChange={(e) => setNewAssignedTo(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Pilih user</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {userLabel(users, u.user_id)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" size="sm" onClick={handleAdd} disabled={adding}>
            {adding ? "Menambah..." : "Tambah Nomor"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
