"use client";

// src/components/settings/KnowledgePlacesManager.tsx

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlaceRow {
  id: string;
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
  source: string;
  review_status: string;
}

/**
 * Kamus Kawasan -- titik peta (nama jalan/kawasan/patokan + koordinat dari link Google Maps).
 * AI Agent memakainya untuk menghitung jarak garis lurus ke listing. Titik "otomatis" muncul
 * dari pencarian peta saat konsumen menyebut jalan yang belum ada di sini -- periksa, lalu
 * ganti dengan titik dari Google Maps kalau meleset.
 */
export function KnowledgePlacesManager() {
  const [places, setPlaces] = useState<PlaceRow[] | null>(null);
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCurator, setIsCurator] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .schema("knowledge")
      .from("places")
      .select("id, name, aliases, lat, lng, source, review_status")
      .order("source", { ascending: true })
      .order("name", { ascending: true });
    setPlaces((data ?? []) as PlaceRow[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.schema("auth_ext").from("profiles").select("is_knowledge_curator").eq("user_id", user.id).maybeSingle();
      setIsCurator(data?.is_knowledge_curator === true);
    })();
  }, [load]);

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/knowledge/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? "Gagal memproses.");
    }
    return (await res.json().catch(() => null)) as { pending?: boolean } | null;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await post({
        action: "add",
        name,
        aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
        mapsUrl,
      });
      setName("");
      setAliases("");
      setMapsUrl("");
      if (result?.pending) setNotice("Terkirim -- menunggu persetujuan kurator sebelum dipakai asisten.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
    setSaving(false);
  }

  async function handleDelete(place: PlaceRow) {
    if (!window.confirm(`Hapus titik "${place.name}"?`)) return;
    try {
      await post({ action: "delete", id: place.id });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleAdd} className="space-y-3 rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="place-name">Nama jalan / kawasan / patokan</Label>
            <Input id="place-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Jalan Ujung Pandang" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="place-aliases">Nama lain (pisahkan koma)</Label>
            <Input id="place-aliases" value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="mis. ujung pandang, jl ujung pandang" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="place-url">Link Google Maps titiknya</Label>
          <Input id="place-url" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={saving || name.trim().length < 3 || !mapsUrl.trim()}>
            {saving ? "Menyimpan..." : "Tambah Titik"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-green-600">{notice}</p>}
        </div>
      </form>

      {places === null ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : places.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada titik. Tambahkan jalan atau kawasan yang sering ditanyakan konsumen.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {places.map((place) => (
            <li key={place.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <div className="text-sm font-medium">
                  {place.name}
                  {place.review_status === "pending" && (
                    <span className="ml-2 rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-normal text-blue-700 dark:text-blue-400">
                      menunggu persetujuan
                    </span>
                  )}
                  {place.source === "geocoded" && (
                    <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-normal text-amber-700 dark:text-amber-400">
                      otomatis, belum diverifikasi
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                  {place.aliases.length > 0 && ` · ${place.aliases.join(", ")}`}
                </div>
              </div>
              {isCurator && (
                <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(place)}>
                  Hapus
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
