"use client";

// src/components/property/PropertyEditableFields.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import { PROPERTY_STATUS_OPTIONS, CERTIFICATE_TYPE_OPTIONS } from "@/constants/property";
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
import { PropertyStatusBadge } from "@/components/property/property-status-badge";

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value || <span className="text-muted-foreground">-</span>}</div>
    </div>
  );
}

interface PropertyEditableFieldsProps {
  listingId: string;
  metadata: Json;
  status: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  landArea: number | null;
  buildingArea: number | null;
  carport: number | null;
  certificateType: string | null;
}

export function PropertyEditableFields({
  listingId,
  metadata,
  status,
  bedrooms,
  bathrooms,
  landArea,
  buildingArea,
  carport,
  certificateType,
}: PropertyEditableFieldsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formStatus, setFormStatus] = useState(status ?? "available");
  const [formBedrooms, setFormBedrooms] = useState(bedrooms?.toString() ?? "");
  const [formBathrooms, setFormBathrooms] = useState(bathrooms?.toString() ?? "");
  const [formLandArea, setFormLandArea] = useState(landArea?.toString() ?? "");
  const [formBuildingArea, setFormBuildingArea] = useState(buildingArea?.toString() ?? "");
  const [formCarport, setFormCarport] = useState(carport?.toString() ?? "");
  const [formCertificateType, setFormCertificateType] = useState(certificateType ?? "");

  function handleCancel() {
    setFormStatus(status ?? "available");
    setFormBedrooms(bedrooms?.toString() ?? "");
    setFormBathrooms(bathrooms?.toString() ?? "");
    setFormLandArea(landArea?.toString() ?? "");
    setFormBuildingArea(buildingArea?.toString() ?? "");
    setFormCarport(carport?.toString() ?? "");
    setFormCertificateType(certificateType ?? "");
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
          status: formStatus,
          bedrooms: formBedrooms ? Number(formBedrooms) : null,
          bathrooms: formBathrooms ? Number(formBathrooms) : null,
          land_area: formLandArea ? Number(formLandArea) : null,
          building_area: formBuildingArea ? Number(formBuildingArea) : null,
          carport: formCarport ? Number(formCarport) : null,
          certificate_type: formCertificateType || null,
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
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Status" value={<PropertyStatusBadge status={status} />} />
          <DetailField label="Kamar Tidur" value={bedrooms} />
          <DetailField label="Kamar Mandi" value={bathrooms} />
          <DetailField label="Luas Tanah" value={landArea ? `${landArea} m²` : undefined} />
          <DetailField label="Luas Bangunan" value={buildingArea ? `${buildingArea} m²` : undefined} />
          <DetailField label="Carport" value={carport} />
          <DetailField label="Sertifikat" value={certificateType} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="edit-status">Status</Label>
          <Select value={formStatus} onValueChange={(v) => setFormStatus(v ?? "available")}>
            <SelectTrigger id="edit-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-bedrooms">Kamar Tidur</Label>
          <Input
            id="edit-bedrooms"
            type="number"
            min="0"
            value={formBedrooms}
            onChange={(e) => setFormBedrooms(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-bathrooms">Kamar Mandi</Label>
          <Input
            id="edit-bathrooms"
            type="number"
            min="0"
            value={formBathrooms}
            onChange={(e) => setFormBathrooms(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-landArea">Luas Tanah (m²)</Label>
          <Input
            id="edit-landArea"
            type="number"
            min="0"
            value={formLandArea}
            onChange={(e) => setFormLandArea(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-buildingArea">Luas Bangunan (m²)</Label>
          <Input
            id="edit-buildingArea"
            type="number"
            min="0"
            value={formBuildingArea}
            onChange={(e) => setFormBuildingArea(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-carport">Carport</Label>
          <Input
            id="edit-carport"
            type="number"
            min="0"
            value={formCarport}
            onChange={(e) => setFormCarport(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-certificateType">Sertifikat</Label>
          <Select
            value={formCertificateType}
            onValueChange={(v) => setFormCertificateType(v ?? "")}
          >
            <SelectTrigger id="edit-certificateType">
              <SelectValue placeholder="Pilih sertifikat" />
            </SelectTrigger>
            <SelectContent>
              {CERTIFICATE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
