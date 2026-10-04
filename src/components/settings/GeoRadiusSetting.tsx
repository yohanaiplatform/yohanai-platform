"use client";

// src/components/settings/GeoRadiusSetting.tsx

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const RADIUS_OPTIONS = [1, 2, 3, 5, 7, 10];

/**
 * Pengaturan peta per akun: radius (km) pencarian fasilitas umum saat menekan "Perbarui Data Lokasi"
 * di listing. Disimpan di auth_ext.profiles.geo_radius_km (1-10, default 2).
 */
export function GeoRadiusSetting() {
  const [radius, setRadius] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.schema("auth_ext").from("profiles").select("geo_radius_km").eq("user_id", user.id).maybeSingle();
      setRadius(data?.geo_radius_km ?? 2);
    })();
  }, []);

  async function handleSave() {
    if (radius === null) return;
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.schema("auth_ext").from("profiles").update({ geo_radius_km: radius }).eq("user_id", user.id);
    setSaving(false);
    setMessage(error ? "Gagal menyimpan." : "Tersimpan. Berlaku untuk pembaruan data lokasi berikutnya.");
  }

  if (radius === null) return <p className="text-sm text-muted-foreground">Memuat...</p>;

  return (
    <div className="space-y-3">
      <div className="max-w-xs space-y-2">
        <Label htmlFor="geo-radius">Radius pencarian fasilitas umum</Label>
        <select
          id="geo-radius"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {RADIUS_OPTIONS.map((km) => (
            <option key={km} value={km}>
              {km} km
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Kampus, rumah sakit, dan mall dicari sampai radius penuh (maks 10 km, cocok untuk menjangkau UNTAN dan kampus
        lain dari listing di Pontianak dan Kubu Raya). Sekolah, klinik, dan tempat ibadah dibatasi lebih dekat supaya
        daftarnya tetap relevan. Setelah mengubah radius, klik &quot;Perbarui Data Lokasi&quot; di tiap listing.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
