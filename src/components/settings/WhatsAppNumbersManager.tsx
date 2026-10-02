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

interface WhatsappNumberRequestRow {
  id: string;
  user_id: string;
  phone_number: string;
  status: string;
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
 * Tampilan beda per role:
 * - Admin: lihat semua nomor terdaftar + permintaan nomor baru yang
 *   menunggu (dari user non-admin) + form tambah nomor langsung.
 * - Non-admin: Kapso (free tier Yohan) cuma izinkan 1 nomor aktif, jadi
 *   tidak bisa daftar sendiri langsung -- lihat status nomor miliknya
 *   sendiri kalau sudah ada, atau ajukan nomor baru (masuk ke daftar
 *   permintaan di atas, notifikasi + email ke admin -- lihat
 *   POST /api/whatsapp-numbers/request).
 *
 * Deteksi admin lewat core.list_assignable_users() (pola sama seperti
 * PropertyConfidentialFields.tsx -- array kosong = bukan admin).
 */
export function WhatsAppNumbersManager() {
  const [users, setUsers] = useState<AssignableUser[] | null>(null);
  const [rows, setRows] = useState<WhatsappNumberRow[] | null>(null);
  const [requests, setRequests] = useState<WhatsappNumberRequestRow[] | null>(null);
  const [myRequest, setMyRequest] = useState<WhatsappNumberRequestRow | null | undefined>(undefined);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newPhoneNumberId, setNewPhoneNumberId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [adding, setAdding] = useState(false);

  const [myPhoneNumber, setMyPhoneNumber] = useState("");
  const [requesting, setRequesting] = useState(false);

  const [approveInputs, setApproveInputs] = useState<Record<string, { phoneNumberId: string; webhookSecret: string }>>({});
  const [approving, setApproving] = useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const [{ data: numbers }, { data: pendingRequests }] = await Promise.all([
      supabase
        .schema("chat")
        .from("whatsapp_numbers")
        .select("id, phone_number_id, label, assigned_to")
        .order("created_at", { ascending: true }),
      supabase
        .schema("chat")
        .from("whatsapp_number_requests")
        .select("id, user_id, phone_number, status")
        .eq("status", "pending")
        .order("requested_at", { ascending: true }),
    ]);
    setRows(numbers ?? []);
    setRequests(pendingRequests ?? []);
  }

  useEffect(() => {
    let active = true;

    (async () => {
      const supabase = createClient();
      const [{ data: assignable }, { data: userData }] = await Promise.all([
        supabase.schema("core").rpc("list_assignable_users"),
        supabase.auth.getUser(),
      ]);
      if (!active) return;
      setUsers(assignable ?? []);
      setCurrentUserId(userData.user?.id ?? null);

      const [{ data: numbers }, { data: pendingRequests }] = await Promise.all([
        supabase
          .schema("chat")
          .from("whatsapp_numbers")
          .select("id, phone_number_id, label, assigned_to")
          .order("created_at", { ascending: true }),
        supabase
          .schema("chat")
          .from("whatsapp_number_requests")
          .select("id, user_id, phone_number, status")
          .eq("status", "pending")
          .order("requested_at", { ascending: true }),
      ]);
      if (!active) return;
      setRows(numbers ?? []);
      setRequests(pendingRequests ?? []);

      if ((assignable ?? []).length === 0 && userData.user) {
        const own = (pendingRequests ?? []).find((r) => r.user_id === userData.user!.id);
        setMyRequest(own ?? null);
      }
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

  async function handleApprove(req: WhatsappNumberRequestRow) {
    const input = approveInputs[req.id];
    if (!input?.phoneNumberId?.trim()) {
      setError("Phone Number ID (Kapso) wajib diisi untuk menyetujui permintaan ini.");
      return;
    }

    setApproving(req.id);
    setError(null);

    const res = await fetch("/api/whatsapp-numbers/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: req.id,
        phoneNumberId: input.phoneNumberId.trim(),
        webhookSecret: input.webhookSecret?.trim() || undefined,
      }),
    });

    setApproving(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Gagal menyetujui permintaan.");
      return;
    }

    refresh();
  }

  async function handleRequest() {
    if (!myPhoneNumber.trim()) {
      setError("Nomor WhatsApp wajib diisi.");
      return;
    }

    setRequesting(true);
    setError(null);

    const res = await fetch("/api/whatsapp-numbers/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: myPhoneNumber.trim() }),
    });

    setRequesting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Gagal mengajukan nomor.");
      return;
    }

    setMyRequest({ id: "", user_id: currentUserId ?? "", phone_number: myPhoneNumber.trim(), status: "pending" });
  }

  if (users === null || rows === null) {
    return <p className="text-sm text-muted-foreground">Memuat...</p>;
  }

  const isAdmin = users.length > 0;

  // -------------------------------------------------------------------
  // Tampilan non-admin -- lihat status nomor sendiri / ajukan nomor baru.
  // -------------------------------------------------------------------
  if (!isAdmin) {
    const myNumber = rows.find((r) => r.assigned_to === currentUserId);

    if (myNumber) {
      return (
        <div className="space-y-1">
          <p className="text-sm">
            Nomor WhatsApp Anda: <span className="font-medium">{myNumber.label || myNumber.phone_number_id}</span>
          </p>
          <p className="text-xs text-muted-foreground">Status: Aktif</p>
        </div>
      );
    }

    if (myRequest) {
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium">Menunggu Verifikasi</p>
          <p className="text-xs text-muted-foreground">
            Nomor {myRequest.phone_number} sudah diajukan -- admin akan mendaftarkannya ke Kapso secara manual.
            Anda akan dapat notifikasi begitu aktif.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="my-phone-number">Nomor WhatsApp Anda</Label>
          <Input
            id="my-phone-number"
            value={myPhoneNumber}
            onChange={(e) => setMyPhoneNumber(e.target.value)}
            placeholder="mis. +62 812-3456-7890"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" size="sm" onClick={handleRequest} disabled={requesting}>
            {requesting ? "Mengajukan..." : "Tambah Nomor"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Tampilan admin -- kelola semua nomor + permintaan yang masuk.
  // -------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {requests && requests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Permintaan Nomor Baru</p>
          <ul className="space-y-2">
            {requests.map((req) => (
              <li key={req.id} className="space-y-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                <p className="text-sm">
                  <span className="font-medium">{userLabel(users, req.user_id)}</span> minta nomor{" "}
                  <span className="font-medium">{req.phone_number}</span> didaftarkan
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    value={approveInputs[req.id]?.phoneNumberId ?? ""}
                    onChange={(e) =>
                      setApproveInputs((prev) => ({ ...prev, [req.id]: { ...prev[req.id], phoneNumberId: e.target.value } }))
                    }
                    placeholder="Phone Number ID (Kapso) setelah didaftarkan"
                  />
                  <Input
                    value={approveInputs[req.id]?.webhookSecret ?? ""}
                    onChange={(e) =>
                      setApproveInputs((prev) => ({ ...prev, [req.id]: { ...prev[req.id], webhookSecret: e.target.value } }))
                    }
                    placeholder="Webhook Secret (opsional, kalau beda dari default)"
                  />
                </div>
                <Button type="button" size="sm" onClick={() => handleApprove(req)} disabled={approving === req.id}>
                  {approving === req.id ? "Menyetujui..." : "Setujui"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

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
