"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------
// Tipe data mengikuti kolom di 4 tabel wilayah (lihat migration
// 001_edit_profile_schema.sql Bagian 2)
// ---------------------------------------------------------------------
interface WilayahRow {
  id: string;
  name: string;
}

export interface WilayahValue {
  provinsiId: string | null;
  kabupatenId: string | null;
  kecamatanId: string | null;
  desaId: string | null;
}

interface WilayahSelectorProps {
  /** Nilai awal, dipakai saat edit profile yang sudah terisi sebagian/semua. */
  initialDesaId?: string | null;
  /** Dipanggil setiap kali desa/kelurahan (level terakhir) berubah. */
  onChange: (value: WilayahValue) => void;
  disabled?: boolean;
}

/**
 * Cascading dropdown: Provinsi -> Kabupaten/Kota -> Kecamatan -> Desa/Kelurahan.
 * Setiap level hanya query dari Supabase saat level di atasnya sudah dipilih.
 * Tidak ada dummy data - kalau tabel kosong (belum di-seed), akan tampil
 * pesan "Data tidak tersedia" di dropdown, bukan silently empty.
 */
export function WilayahSelector({
  initialDesaId,
  onChange,
  disabled,
}: WilayahSelectorProps) {
  const supabase = createClient();

  const [provinsiList, setProvinsiList] = useState<WilayahRow[]>([]);
  const [kabupatenList, setKabupatenList] = useState<WilayahRow[]>([]);
  const [kecamatanList, setKecamatanList] = useState<WilayahRow[]>([]);
  const [desaList, setDesaList] = useState<WilayahRow[]>([]);

  const [provinsiId, setProvinsiId] = useState<string | null>(null);
  const [kabupatenId, setKabupatenId] = useState<string | null>(null);
  const [kecamatanId, setKecamatanId] = useState<string | null>(null);
  const [desaId, setDesaId] = useState<string | null>(null);

  const [loadingLevel, setLoadingLevel] = useState<
    "provinsi" | "kabupaten" | "kecamatan" | "desa" | null
  >("provinsi");

  // -------------------------------------------------------------
  // Load provinsi sekali saat mount
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;
    setLoadingLevel("provinsi");
    supabase
      .from("wilayah_provinsi")
      .select("id, name")
      .order("name")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Gagal memuat provinsi:", error.message);
          setProvinsiList([]);
        } else {
          setProvinsiList(data ?? []);
        }
        setLoadingLevel(null);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  // -------------------------------------------------------------
  // Kalau ada initialDesaId (mode edit), resolve balik ke atas:
  // desa -> kecamatan -> kabupaten -> provinsi, supaya dropdown
  // ter-prefill dengan benar saat form dibuka.
  // -------------------------------------------------------------
  useEffect(() => {
    if (!initialDesaId) return;
    let active = true;

    (async () => {
      const { data: desaRow, error: desaErr } = await supabase
        .from("wilayah_desa")
        .select("id, name, kecamatan_id")
        .eq("id", initialDesaId)
        .single();
      if (desaErr || !desaRow || !active) return;

      const { data: kecRow, error: kecErr } = await supabase
        .from("wilayah_kecamatan")
        .select("id, name, kabupaten_id")
        .eq("id", desaRow.kecamatan_id)
        .single();
      if (kecErr || !kecRow || !active) return;

      const { data: kabRow, error: kabErr } = await supabase
        .from("wilayah_kabupaten")
        .select("id, name, provinsi_id")
        .eq("id", kecRow.kabupaten_id)
        .single();
      if (kabErr || !kabRow || !active) return;

      // Set berurutan dari atas supaya efek cascading di bawah
      // tidak balapan reset nilai yang baru saja kita isi.
      setProvinsiId(kabRow.provinsi_id);
      const { data: kabList } = await supabase
        .from("wilayah_kabupaten")
        .select("id, name")
        .eq("provinsi_id", kabRow.provinsi_id)
        .order("name");
      if (!active) return;
      setKabupatenList(kabList ?? []);
      setKabupatenId(kabRow.id);

      const { data: kecList } = await supabase
        .from("wilayah_kecamatan")
        .select("id, name")
        .eq("kabupaten_id", kabRow.id)
        .order("name");
      if (!active) return;
      setKecamatanList(kecList ?? []);
      setKecamatanId(kecRow.id);

      const { data: desaListData } = await supabase
        .from("wilayah_desa")
        .select("id, name")
        .eq("kecamatan_id", kecRow.id)
        .order("name");
      if (!active) return;
      setDesaList(desaListData ?? []);
      setDesaId(desaRow.id);
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDesaId]);

  // -------------------------------------------------------------
  // Handler tiap level: reset semua level di bawahnya
  // -------------------------------------------------------------
  const handleProvinsiChange = useCallback(
    async (value: string) => {
      setProvinsiId(value);
      setKabupatenId(null);
      setKecamatanId(null);
      setDesaId(null);
      setKecamatanList([]);
      setDesaList([]);

      setLoadingLevel("kabupaten");
      const { data, error } = await supabase
        .from("wilayah_kabupaten")
        .select("id, name")
        .eq("provinsi_id", value)
        .order("name");
      if (error) {
        console.error("Gagal memuat kabupaten:", error.message);
        setKabupatenList([]);
      } else {
        setKabupatenList(data ?? []);
      }
      setLoadingLevel(null);
    },
    [supabase]
  );

  const handleKabupatenChange = useCallback(
    async (value: string) => {
      setKabupatenId(value);
      setKecamatanId(null);
      setDesaId(null);
      setDesaList([]);

      setLoadingLevel("kecamatan");
      const { data, error } = await supabase
        .from("wilayah_kecamatan")
        .select("id, name")
        .eq("kabupaten_id", value)
        .order("name");
      if (error) {
        console.error("Gagal memuat kecamatan:", error.message);
        setKecamatanList([]);
      } else {
        setKecamatanList(data ?? []);
      }
      setLoadingLevel(null);
    },
    [supabase]
  );

  const handleKecamatanChange = useCallback(
    async (value: string) => {
      setKecamatanId(value);
      setDesaId(null);

      setLoadingLevel("desa");
      const { data, error } = await supabase
        .from("wilayah_desa")
        .select("id, name")
        .eq("kecamatan_id", value)
        .order("name");
      if (error) {
        console.error("Gagal memuat desa:", error.message);
        setDesaList([]);
      } else {
        setDesaList(data ?? []);
      }
      setLoadingLevel(null);
    },
    [supabase]
  );

  const handleDesaChange = useCallback((value: string) => {
    setDesaId(value);
  }, []);

  // -------------------------------------------------------------
  // Beritahu parent form setiap kali desa (level final) berubah
  // -------------------------------------------------------------
  useEffect(() => {
    onChange({ provinsiId, kabupatenId, kecamatanId, desaId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinsiId, kabupatenId, kecamatanId, desaId]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="wilayah-provinsi">Provinsi</Label>
        <Select
          value={provinsiId ?? undefined}
          onValueChange={handleProvinsiChange}
          disabled={disabled || loadingLevel === "provinsi"}
        >
          <SelectTrigger id="wilayah-provinsi">
            <SelectValue
              placeholder={
                loadingLevel === "provinsi" ? "Memuat..." : "Pilih provinsi"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {provinsiList.length === 0 && loadingLevel !== "provinsi" ? (
              <SelectItem value="__empty" disabled>
                Data tidak tersedia
              </SelectItem>
            ) : (
              provinsiList.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wilayah-kabupaten">Kabupaten/Kota</Label>
        <Select
          value={kabupatenId ?? undefined}
          onValueChange={handleKabupatenChange}
          disabled={disabled || !provinsiId || loadingLevel === "kabupaten"}
        >
          <SelectTrigger id="wilayah-kabupaten">
            <SelectValue
              placeholder={
                !provinsiId
                  ? "Pilih provinsi dahulu"
                  : loadingLevel === "kabupaten"
                  ? "Memuat..."
                  : "Pilih kabupaten/kota"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {kabupatenList.length === 0 && loadingLevel !== "kabupaten" ? (
              <SelectItem value="__empty" disabled>
                Data tidak tersedia
              </SelectItem>
            ) : (
              kabupatenList.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wilayah-kecamatan">Kecamatan</Label>
        <Select
          value={kecamatanId ?? undefined}
          onValueChange={handleKecamatanChange}
          disabled={disabled || !kabupatenId || loadingLevel === "kecamatan"}
        >
          <SelectTrigger id="wilayah-kecamatan">
            <SelectValue
              placeholder={
                !kabupatenId
                  ? "Pilih kabupaten/kota dahulu"
                  : loadingLevel === "kecamatan"
                  ? "Memuat..."
                  : "Pilih kecamatan"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {kecamatanList.length === 0 && loadingLevel !== "kecamatan" ? (
              <SelectItem value="__empty" disabled>
                Data tidak tersedia
              </SelectItem>
            ) : (
              kecamatanList.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wilayah-desa">Desa/Kelurahan</Label>
        <Select
          value={desaId ?? undefined}
          onValueChange={handleDesaChange}
          disabled={disabled || !kecamatanId || loadingLevel === "desa"}
        >
          <SelectTrigger id="wilayah-desa">
            <SelectValue
              placeholder={
                !kecamatanId
                  ? "Pilih kecamatan dahulu"
                  : loadingLevel === "desa"
                  ? "Memuat..."
                  : "Pilih desa/kelurahan"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {desaList.length === 0 && loadingLevel !== "desa" ? (
              <SelectItem value="__empty" disabled>
                Data tidak tersedia
              </SelectItem>
            ) : (
              desaList.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}