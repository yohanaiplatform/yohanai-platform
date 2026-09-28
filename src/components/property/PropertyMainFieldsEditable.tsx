"use client";

// src/components/property/PropertyMainFieldsEditable.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/property/formatRupiah";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PropertyMainFieldsEditableProps {
  listingId: string;
  title: string;
  price: number;
  address: string | null;
  description: string | null;
}

/** Edit judul/harga/alamat/deskripsi -- field kolom asli (bukan metadata JSONB), beda tabel dari PropertyEditableFields. */
export function PropertyMainFieldsEditable({
  listingId,
  title,
  price,
  address,
  description,
}: PropertyMainFieldsEditableProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState(title);
  const [formPrice, setFormPrice] = useState(String(price));
  const [formAddress, setFormAddress] = useState(address ?? "");
  const [formDescription, setFormDescription] = useState(description ?? "");

  function handleCancel() {
    setFormTitle(title);
    setFormPrice(String(price));
    setFormAddress(address ?? "");
    setFormDescription(description ?? "");
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!formTitle.trim() || !formPrice.trim()) {
      setError("Judul dan Harga wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema("property")
      .from("listings")
      .update({
        title: formTitle.trim(),
        price: Number(formPrice),
        address: formAddress.trim() || null,
        description: formDescription.trim() || null,
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

  async function handleDelete() {
    if (!window.confirm(`Hapus listing "${title}"? Bisa dipulihkan lewat database kalau salah hapus.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .schema("property")
      .from("listings")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", listingId);

    setDeleting(false);

    if (deleteError) {
      setError("Gagal menghapus listing. Coba lagi.");
      return;
    }

    router.push("/properties");
    router.refresh();
  }

  if (!isEditing) {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-2xl font-semibold text-brand">{formatRupiah(price)}</p>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </div>
        {address && <p className="text-sm text-muted-foreground">{address}</p>}
        {description && <p className="whitespace-pre-wrap text-sm">{description}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-title">Judul *</Label>
        <Input id="edit-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-price">Harga (Rp) *</Label>
        <Input
          id="edit-price"
          type="number"
          min="0"
          value={formPrice}
          onChange={(e) => setFormPrice(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-address">Alamat</Label>
        <Input id="edit-address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-description">Deskripsi</Label>
        <Textarea
          id="edit-description"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          rows={5}
        />
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
