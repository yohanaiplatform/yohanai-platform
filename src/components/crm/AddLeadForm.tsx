"use client";

// src/components/crm/AddLeadForm.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createLead } from "@/lib/crm/createLead";
import {
  LEAD_KATEGORI_OPTIONS,
  LEAD_SUMBER_OPTIONS,
  LEAD_TEMPERATURE_OPTIONS,
  LEAD_SUDAH_SURVEY_OPTIONS,
} from "@/constants/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignableUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role_name: string | null;
}

export function AddLeadForm() {
  const router = useRouter();

  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[] | null>(null);
  const [assignedTo, setAssignedTo] = useState("");

  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [kategori, setKategori] = useState("");
  const [sumberInformasi, setSumberInformasi] = useState("");
  const [minatUnitLokasi, setMinatUnitLokasi] = useState("");
  const [permintaan, setPermintaan] = useState("");
  const [komentar, setKomentar] = useState("");
  const [sudahSurvey, setSudahSurvey] = useState("");
  const [statusFunnelAwal, setStatusFunnelAwal] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const supabase = createClient();
      const [{ data: userData }, { data: users }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.schema("core").rpc("list_assignable_users"),
      ]);

      if (!active) return;

      const uid = userData.user?.id ?? null;
      setAssignableUsers(users ?? []);
      // Default: assign ke diri sendiri. Admin boleh ganti lewat dropdown
      // di bawah, non-admin tidak (RLS cuma izinkan assigned_to = diri sendiri).
      setAssignedTo(uid ?? "");
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nama.trim() || !phone.trim() || !assignedTo) {
      setError("Nama, No. HP, dan Ditugaskan ke wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { leadId, error: createError } = await createLead(supabase, {
      nama,
      phone,
      email,
      kategori,
      sumberInformasi,
      minatUnitLokasi,
      permintaan,
      komentar,
      sudahSurvey,
      statusFunnelAwal,
      assignedTo,
    });

    setSubmitting(false);

    if (createError || !leadId) {
      setError(createError ?? "Gagal menyimpan lead. Coba lagi.");
      return;
    }

    router.push(`/crm/${leadId}`);
  }

  const isAdmin = (assignableUsers?.length ?? 0) > 0;
  const assignedUser = assignableUsers?.find((u) => u.user_id === assignedTo);
  const assignedToLabel = assignedUser
    ? `${assignedUser.display_name ?? assignedUser.email ?? assignedUser.user_id}${
        assignedUser.role_name ? ` (${assignedUser.role_name})` : ""
      }`
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nama">Nama *</Label>
          <Input
            id="nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="mis. Budi Santoso"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">No. HP *</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="mis. 08123456789"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="opsional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sumber">Sumber Informasi</Label>
          <Select value={sumberInformasi} onValueChange={(v) => setSumberInformasi(v ?? "")}>
            <SelectTrigger id="sumber">
              <SelectValue placeholder="Pilih sumber" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SUMBER_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kategori">Kategori / Property</Label>
          <Select value={kategori} onValueChange={(v) => setKategori(v ?? "")}>
            <SelectTrigger id="kategori">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_KATEGORI_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minatUnitLokasi">Minat Unit / Lokasi</Label>
          <Input
            id="minatUnitLokasi"
            value={minatUnitLokasi}
            onChange={(e) => setMinatUnitLokasi(e.target.value)}
            placeholder="mis. Ampera Raya"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature Awal</Label>
          <Select value={statusFunnelAwal} onValueChange={(v) => setStatusFunnelAwal(v ?? "")}>
            <SelectTrigger id="temperature">
              <SelectValue placeholder="Pilih temperature" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_TEMPERATURE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sudahSurvey">Sudah Survey</Label>
          <Select value={sudahSurvey} onValueChange={(v) => setSudahSurvey(v ?? "")}>
            <SelectTrigger id="sudahSurvey">
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SUDAH_SURVEY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Ditugaskan ke *</Label>
            <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? "")}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Pilih agent">
                  {assignedToLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(assignableUsers ?? []).map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.display_name ?? u.email ?? u.user_id}
                    {u.role_name ? ` (${u.role_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="permintaan">Permintaan</Label>
        <Textarea
          id="permintaan"
          value={permintaan}
          onChange={(e) => setPermintaan(e.target.value)}
          placeholder="mis. Nanti survey tanggal 8 atau 9"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="komentar">Komentar</Label>
        <Textarea
          id="komentar"
          value={komentar}
          onChange={(e) => setKomentar(e.target.value)}
          placeholder="Catatan tambahan"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan Lead"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}
