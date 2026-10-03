"use client";

// src/components/crm/LeadIdentityEditable.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LeadIdentityEditableProps {
  leadId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

/**
 * Edit Nama/Email/Telepon -- field kolom asli di customer.leads (beda dari
 * LeadEditableFields yang isinya field metadata JSONB). Dibutuhkan karena
 * nama lead bisa berubah setelah lead sendiri konfirmasi nama aslinya lewat
 * WA (AI Agent otomatis update via confirmedName, tapi admin/agent juga
 * perlu bisa koreksi manual -- mis. kalau konfirmasinya ketemu lewat jalur
 * lain, bukan WA).
 */
export function LeadIdentityEditable({ leadId, firstName, lastName, email, phone }: LeadIdentityEditableProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formFirstName, setFormFirstName] = useState(firstName);
  const [formLastName, setFormLastName] = useState(lastName);
  const [formEmail, setFormEmail] = useState(email ?? "");
  const [formPhone, setFormPhone] = useState(phone ?? "");

  function handleCancel() {
    setFormFirstName(firstName);
    setFormLastName(lastName);
    setFormEmail(email ?? "");
    setFormPhone(phone ?? "");
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!formFirstName.trim()) {
      setError("Nama Depan wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema("customer")
      .from("leads")
      .update({
        first_name: formFirstName.trim(),
        last_name: formLastName.trim(),
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
      })
      .eq("id", leadId);

    setSaving(false);

    if (updateError) {
      setError("Gagal menyimpan perubahan. Coba lagi.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    const displayName = `${firstName} ${lastName}`.trim() || phone || "lead ini";
    if (
      !window.confirm(
        `Hapus lead "${displayName}"? Lead hilang dari daftar CRM beserta percakapannya di layar. Data tetap tersimpan di database dan bisa dipulihkan lewat database kalau salah hapus.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .schema("customer")
      .from("leads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", leadId);

    if (deleteError) {
      setDeleting(false);
      setError("Gagal menghapus lead. Coba lagi.");
      return;
    }

    router.push("/crm");
    router.refresh();
  }

  if (!isEditing) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)} disabled={deleting}>
          Edit Nama/Kontak
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Menghapus..." : "Hapus Lead"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-firstName">Nama Depan *</Label>
          <Input id="edit-firstName" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-lastName">Nama Belakang</Label>
          <Input id="edit-lastName" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-phone">Telepon</Label>
          <Input id="edit-phone" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input id="edit-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
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
