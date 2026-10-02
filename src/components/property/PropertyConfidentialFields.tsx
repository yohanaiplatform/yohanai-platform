"use client";

// src/components/property/PropertyConfidentialFields.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OwnerData {
  name: string | null;
  phone: string | null;
}

interface CommissionData {
  type: "percentage" | "fixed" | null;
  value: number | null;
}

interface PropertyConfidentialFieldsProps {
  listingId: string;
  metadata: Json;
  owner: OwnerData | null;
  commission: CommissionData | null;
}

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value || <span className="text-muted-foreground">-</span>}</div>
    </div>
  );
}

function formatCommission(commission: CommissionData | null): string | null {
  if (!commission?.value) return null;
  if (commission.type === "percentage") return `${commission.value}%`;
  return `Rp ${commission.value.toLocaleString("id-ID")}`;
}

/**
 * Data Pemilik & Nilai Komisi -- sengaja TIDAK pernah dikirim ke
 * PropertyExportButtons/exportFlyer atau path publik apa pun. Kalau nanti
 * ada halaman listing publik (crawler-accessible), field metadata.owner &
 * metadata.commission WAJIB di-strip eksplisit sebelum dikirim ke client,
 * jangan spread metadata mentah.
 *
 * Visibilitas & edit: RLS listings_owner_or_admin (migration 043) sudah cukup --
 * yang bisa lihat/ubah listing ini cuma admin atau agent yang di-assign.
 */
export function PropertyConfidentialFields({
  listingId,
  metadata,
  owner,
  commission,
}: PropertyConfidentialFieldsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOwnerName, setFormOwnerName] = useState(owner?.name ?? "");
  const [formOwnerPhone, setFormOwnerPhone] = useState(owner?.phone ?? "");
  const [formCommissionType, setFormCommissionType] = useState<"percentage" | "fixed">(
    commission?.type ?? "percentage"
  );
  const [formCommissionValue, setFormCommissionValue] = useState(commission?.value?.toString() ?? "");

  function handleCancel() {
    setFormOwnerName(owner?.name ?? "");
    setFormOwnerPhone(owner?.phone ?? "");
    setFormCommissionType(commission?.type ?? "percentage");
    setFormCommissionValue(commission?.value?.toString() ?? "");
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const baseMetadata =
      typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) ? metadata : {};

    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema("property")
      .from("listings")
      .update({
        metadata: {
          ...baseMetadata,
          owner: {
            name: formOwnerName.trim() || null,
            phone: formOwnerPhone.trim() || null,
          },
          commission: {
            type: formCommissionType,
            value: formCommissionValue ? Number(formCommissionValue) : null,
          },
        },
      })
      .eq("id", listingId);

    setSaving(false);

    if (updateError) {
      setError("Gagal menyimpan perubahan. Coba lagi.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <DetailField label="Nama Pemilik" value={owner?.name} />
          <DetailField label="No. HP Pemilik" value={owner?.phone} />
          <DetailField label="Nilai Komisi" value={formatCommission(commission)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-owner-name">Nama Pemilik</Label>
          <Input
            id="edit-owner-name"
            value={formOwnerName}
            onChange={(e) => setFormOwnerName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-owner-phone">No. HP Pemilik</Label>
          <Input
            id="edit-owner-phone"
            value={formOwnerPhone}
            onChange={(e) => setFormOwnerPhone(e.target.value)}
            placeholder="mis. 0812-3456-7890"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-commission-type">Tipe Komisi</Label>
          <Select
            value={formCommissionType}
            onValueChange={(v) => setFormCommissionType((v as "percentage" | "fixed") ?? "percentage")}
          >
            <SelectTrigger id="edit-commission-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Persentase (%)</SelectItem>
              <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-commission-value">
            Nilai Komisi {formCommissionType === "percentage" ? "(%)" : "(Rp)"}
          </Label>
          <Input
            id="edit-commission-value"
            type="number"
            min="0"
            step={formCommissionType === "percentage" ? "0.1" : "1"}
            value={formCommissionValue}
            onChange={(e) => setFormCommissionValue(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Save"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
          Batal
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
