"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Default kalau user belum pernah simpan preferensi sama sekali
// (belum ada baris di database) -- semua aktif by default.
const DEFAULT_PREFS = {
  new_lead_email: true,
  new_lead_inapp: true,
  message_email: true,
  message_inapp: true,
  property_update_email: true,
  property_update_inapp: true,
  marketing_email: true,
};

type Prefs = typeof DEFAULT_PREFS;

export function NotificationPreferencesForm({ userId }: { userId: string }) {
  const supabase = createClient();

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .schema("auth_ext")
        .from("notification_preferences")
        .select(
          "new_lead_email, new_lead_inapp, message_email, message_inapp, property_update_email, property_update_inapp, marketing_email"
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Gagal memuat preferensi notifikasi:", error);
      } else if (data) {
        // Ada baris tersimpan -> pakai nilai itu.
        setPrefs(data as Prefs);
      }
      // Kalau tidak error tapi data null, berarti user belum pernah
      // simpan sama sekali -> tetap pakai DEFAULT_PREFS (semua aktif),
      // baris baru akan dibuat pertama kali user klik Simpan.

      setLoading(false);
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggle = (key: keyof Prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    const { error } = await supabase
      .schema("auth_ext")
      .from("notification_preferences")
      .upsert(
        { user_id: userId, ...prefs },
        { onConflict: "user_id" }
      );

    setSaving(false);

    if (error) {
      console.error("Gagal menyimpan preferensi notifikasi:", error);
      setSaveError("Gagal menyimpan. Coba lagi.");
      return;
    }

    setSaveMessage("Preferensi tersimpan.");
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat preferensi...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-medium text-sm">New Lead Alert</h3>
        <p className="text-xs text-muted-foreground">
          Notifikasi saat ada calon pembeli baru yang cocok dengan kriteria kamu.
        </p>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="new_lead_email"
              checked={prefs.new_lead_email}
              onCheckedChange={() => toggle("new_lead_email")}
            />
            <Label htmlFor="new_lead_email" className="cursor-pointer font-normal">
              Email
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="new_lead_inapp"
              checked={prefs.new_lead_inapp}
              onCheckedChange={() => toggle("new_lead_inapp")}
            />
            <Label htmlFor="new_lead_inapp" className="cursor-pointer font-normal">
              Dalam Aplikasi
            </Label>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium text-sm">Pesan/Chat</h3>
        <p className="text-xs text-muted-foreground">
          Notifikasi saat ada pesan masuk dari lead atau tim.
        </p>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="message_email"
              checked={prefs.message_email}
              onCheckedChange={() => toggle("message_email")}
            />
            <Label htmlFor="message_email" className="cursor-pointer font-normal">
              Email
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="message_inapp"
              checked={prefs.message_inapp}
              onCheckedChange={() => toggle("message_inapp")}
            />
            <Label htmlFor="message_inapp" className="cursor-pointer font-normal">
              Dalam Aplikasi
            </Label>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium text-sm">Update Properti</h3>
        <p className="text-xs text-muted-foreground">
          Notifikasi saat ada perubahan status listing (harga berubah, terjual, dll).
        </p>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="property_update_email"
              checked={prefs.property_update_email}
              onCheckedChange={() => toggle("property_update_email")}
            />
            <Label htmlFor="property_update_email" className="cursor-pointer font-normal">
              Email
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="property_update_inapp"
              checked={prefs.property_update_inapp}
              onCheckedChange={() => toggle("property_update_inapp")}
            />
            <Label htmlFor="property_update_inapp" className="cursor-pointer font-normal">
              Dalam Aplikasi
            </Label>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium text-sm">Marketing/Promo</h3>
        <p className="text-xs text-muted-foreground">
          Newsletter, tips, dan info promosi dari YohanAI Platform.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="marketing_email"
            checked={prefs.marketing_email}
            onCheckedChange={() => toggle("marketing_email")}
          />
          <Label htmlFor="marketing_email" className="cursor-pointer font-normal">
            Email
          </Label>
        </div>
      </section>

      <section className="space-y-1 rounded-lg border p-3">
        <h3 className="font-medium text-sm">Keamanan Akun</h3>
        <p className="text-xs text-muted-foreground">
          Email terkait keamanan (ganti password, aktivitas login) selalu
          aktif dan tidak bisa dimatikan, untuk melindungi akun kamu.
        </p>
      </section>

      <div className="space-y-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Preferensi"}
        </Button>
        {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      </div>
    </div>
  );
}