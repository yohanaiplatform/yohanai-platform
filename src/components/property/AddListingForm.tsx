"use client";

// src/components/property/AddListingForm.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createListing } from "@/lib/property/createListing";
import { PROPERTY_STATUS_OPTIONS, CERTIFICATE_TYPE_OPTIONS } from "@/constants/property";
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

interface Category {
  id: string;
  name: string;
}

interface AssignableUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role_name: string | null;
}

interface AddListingFormProps {
  categories: Category[];
}

export function AddListingForm({ categories }: AddListingFormProps) {
  const router = useRouter();

  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[] | null>(null);
  const [assignedTo, setAssignedTo] = useState("");

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("available");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [landArea, setLandArea] = useState("");
  const [buildingArea, setBuildingArea] = useState("");
  const [carport, setCarport] = useState("");
  const [certificateType, setCertificateType] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryLabel = categories.find((c) => c.id === categoryId)?.name;

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
      // di bawah, non-admin tidak (RLS listings_owner_or_admin cuma izinkan
      // assigned_to = diri sendiri). Pola sama seperti AddLeadForm.tsx.
      setAssignedTo(uid ?? "");
    })();

    return () => {
      active = false;
    };
  }, []);

  const isAdmin = (assignableUsers?.length ?? 0) > 0;
  const assignedUser = assignableUsers?.find((u) => u.user_id === assignedTo);
  const assignedToLabel = assignedUser
    ? `${assignedUser.display_name ?? assignedUser.email ?? assignedUser.user_id}${
        assignedUser.role_name ? ` (${assignedUser.role_name})` : ""
      }`
    : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !price.trim() || !assignedTo) {
      setError("Judul, Harga, dan Ditugaskan ke wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { listingId, slug, error: createError } = await createListing(supabase, {
      title,
      categoryId,
      assignedTo,
      price: Number(price),
      address,
      description,
      status,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      landArea: landArea ? Number(landArea) : undefined,
      buildingArea: buildingArea ? Number(buildingArea) : undefined,
      carport: carport ? Number(carport) : undefined,
      certificateType,
      videoUrl,
      contactPhone,
    });

    setSubmitting(false);

    if (createError || !listingId || !slug) {
      setError(createError ?? "Gagal menyimpan listing. Coba lagi.");
      return;
    }

    router.push(`/properties/${slug}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Judul *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="mis. Rumah Minimalis Siap Huni - Serdam"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Harga (Rp) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="mis. 450000000"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Pilih kategori">{categoryLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
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
                <SelectValue placeholder="Pilih penanggung jawab">{assignedToLabel}</SelectValue>
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

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "available")}>
            <SelectTrigger id="status">
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

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Alamat</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="mis. Jl. Serdam No. 12, Sungai Raya Dalam"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms">Kamar Tidur</Label>
          <Input
            id="bedrooms"
            type="number"
            min="0"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">Kamar Mandi</Label>
          <Input
            id="bathrooms"
            type="number"
            min="0"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="landArea">Luas Tanah (m²)</Label>
          <Input
            id="landArea"
            type="number"
            min="0"
            value={landArea}
            onChange={(e) => setLandArea(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buildingArea">Luas Bangunan (m²)</Label>
          <Input
            id="buildingArea"
            type="number"
            min="0"
            value={buildingArea}
            onChange={(e) => setBuildingArea(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carport">Carport</Label>
          <Input
            id="carport"
            type="number"
            min="0"
            value={carport}
            onChange={(e) => setCarport(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificateType">Sertifikat</Label>
          <Select value={certificateType} onValueChange={(v) => setCertificateType(v ?? "")}>
            <SelectTrigger id="certificateType">
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

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="videoUrl">Link Video (YouTube/Google Drive)</Label>
          <Input
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contactPhone">No. HP Kontak (tampil di flyer)</Label>
          <Input
            id="contactPhone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="mis. 0821-5041-5012"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Foto bisa ditambahkan setelah listing tersimpan, di halaman detail.
      </p>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan Listing"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}
