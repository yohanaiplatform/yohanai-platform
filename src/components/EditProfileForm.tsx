"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { WilayahSelector, type WilayahValue } from "@/components/WilayahSelector";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

// =====================================================================
// Tipe data
// =====================================================================
interface BusinessRole {
  id: string;
  code: string;
  name: string;
}

interface CompletenessRule {
  id: string;
  business_role_id: string | null;
  tier: 1 | 2;
  field_key: string;
  source: "profiles_column" | "auth_users_column" | "role_details_json";
  label: string;
  depends_on_field_key: string | null;
  depends_on_value: string | null;
}

interface CompletenessResult {
  is_complete: boolean;
  percentage: number;
  missing_fields: { field_key: string; label: string }[];
  total_fields: number;
  filled_fields: number;
}

// -----------------------------------------------------------------
// Registry tipe input per field_key. INI SENGAJA hardcode di client
// (lihat penjelasan di chat) - profile_completeness_rules cuma
// mengatur field mana yang wajib/kondisional, bukan tipe UI-nya.
// Kalau nambah rule baru ke tabel, tambahkan juga mapping-nya di sini.
// -----------------------------------------------------------------
type FieldInputType = "text" | "url" | "number" | "yesno";

const FIELD_INPUT_TYPE: Record<string, FieldInputType> = {
  service_area: "text",
  property_specialization: "text",
  has_broker_certificate: "yesno",
  broker_certificate_number: "text",
  agency_name: "text",
  position: "text",
  is_arebi_member: "yesno",
  company_name: "text",
  company_legal_id: "text",
  property_count: "number",
  asset_types: "text",
  avatar_url: "url",
  facebook_url: "url",
  instagram_url: "url",
};

// =====================================================================
// Komponen utama
// =====================================================================
export function EditProfileForm({ userId }: { userId: string }) {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [businessRoles, setBusinessRoles] = useState<BusinessRole[]>([]);
  const [rules, setRules] = useState<CompletenessRule[]>([]);
  const [phoneConfirmedAt, setPhoneConfirmedAt] = useState<string | null>(null);

  const [completenessTier1, setCompletenessTier1] =
    useState<CompletenessResult | null>(null);
  const [completenessTier2, setCompletenessTier2] =
    useState<CompletenessResult | null>(null);

  // Form state
  const [businessRoleId, setBusinessRoleId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [wilayah, setWilayah] = useState<WilayahValue>({
    provinsiId: null,
    kabupatenId: null,
    kecamatanId: null,
    desaId: null,
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [roleDetails, setRoleDetails] = useState<Record<string, string>>({});

  // -------------------------------------------------------------
  // Load awal: profile, phone dari auth session (BUKAN query
  // langsung ke auth.users - itu tidak diexpose lewat REST),
  // daftar business_roles, dan seluruh rules (tier 1 + tier 2).
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);

      const [
        { data: profile, error: profileErr },
        { data: authUser },
        { data: rolesData, error: rolesErr },
        { data: rulesData, error: rulesErr2 },
      ] = await Promise.all([
        supabase
          .schema("auth_ext")
          .from("profiles")
          .select(
            "business_role_id, first_name, address_line, wilayah_desa_id, avatar_url, facebook_url, instagram_url, role_details"
          )
          .eq("user_id", userId)
          .single(),
        supabase.auth.getUser(),
        supabase.schema("core").from("business_roles").select("id, code, name").eq("is_active", true).order("name"),
        supabase.from("profile_completeness_rules").select("*").eq("is_active", true),
      ]);

      if (!active) return;

      if (profileErr) {
        console.error("Gagal memuat profile:", profileErr.message);
      } else if (profile) {
        setBusinessRoleId(profile.business_role_id);
        setFirstName(profile.first_name ?? "");
        setAddressLine(profile.address_line ?? "");
        setWilayah((w) => ({ ...w, desaId: profile.wilayah_desa_id }));
        setAvatarUrl(profile.avatar_url ?? "");
        setFacebookUrl(profile.facebook_url ?? "");
        setInstagramUrl(profile.instagram_url ?? "");
        setRoleDetails((profile.role_details as Record<string, string>) ?? {});
      }

      // Nomor telepon & status verifikasi datang dari session auth,
      // BUKAN dari query tabel - schema `auth` tidak diexpose ke REST.
      setPhoneConfirmedAt(authUser?.user?.phone_confirmed_at ?? null);

      if (rolesErr) {
        console.error("Gagal memuat business_roles:", rolesErr.message);
        setSaveError(
          "Tidak bisa memuat daftar role bisnis. Cek apakah schema 'core' sudah di-expose di Supabase API settings."
        );
      } else {
        setBusinessRoles(rolesData ?? []);
      }

      if (rulesErr2) {
        console.error("Gagal memuat completeness rules:", rulesErr2.message);
      } else {
        setRules((rulesData as CompletenessRule[]) ?? []);
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // -------------------------------------------------------------
  // Refresh progress completeness (dipanggil setelah load awal
  // dan setelah simpan berhasil)
  // -------------------------------------------------------------
  const refreshCompleteness = useCallback(async () => {
    const [{ data: t1 }, { data: t2 }] = await Promise.all([
      supabase.rpc("check_profile_completeness", {
        p_user_id: userId,
        p_tier: 1,
      }),
      supabase.rpc("check_profile_completeness", {
        p_user_id: userId,
        p_tier: 2,
      }),
    ]);
    setCompletenessTier1((t1 as CompletenessResult) ?? null);
    setCompletenessTier2((t2 as CompletenessResult) ?? null);
  }, [supabase, userId]);

  useEffect(() => {
    if (!loading) refreshCompleteness();
  }, [loading, refreshCompleteness]);

  // -------------------------------------------------------------
  // Rules relevan untuk role yang sedang dipilih:
  // business_role_id NULL (berlaku semua) ATAU = role terpilih
  // -------------------------------------------------------------
  const relevantRules = useMemo(
    () =>
      rules.filter(
        (r) => r.business_role_id === null || r.business_role_id === businessRoleId
      ),
    [rules, businessRoleId]
  );

  const tier2RoleSpecificRules = useMemo(
    () =>
      relevantRules.filter(
        (r) => r.tier === 2 && r.business_role_id !== null && r.source === "role_details_json"
      ),
    [relevantRules]
  );

  // Cek apakah rule kondisional (mis. no. sertifikat) sedang relevan
  // berdasarkan nilai roleDetails saat ini di form.
  const isRuleVisible = useCallback(
    (rule: CompletenessRule) => {
      if (!rule.depends_on_field_key) return true;
      return roleDetails[rule.depends_on_field_key] === rule.depends_on_value;
    },
    [roleDetails]
  );

  const setRoleDetailField = (key: string, value: string) => {
    setRoleDetails((prev) => ({ ...prev, [key]: value }));
  };

  // -------------------------------------------------------------
  // Simpan
  // -------------------------------------------------------------
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    const { error } = await supabase
      .schema("auth_ext")
      .from("profiles")
      .update({
        business_role_id: businessRoleId,
        first_name: firstName || null,
        address_line: addressLine || null,
        wilayah_desa_id: wilayah.desaId,
        avatar_url: avatarUrl || null,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        role_details: roleDetails,
      })
      .eq("user_id", userId);

    setSaving(false);

    if (error) {
      console.error("Gagal menyimpan profile:", error.message);
      setSaveError("Gagal menyimpan perubahan. Coba lagi.");
      return;
    }

    setSaveMessage("Perubahan tersimpan.");
    refreshCompleteness();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat profil...</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* ---------------- Progress ---------------- */}
      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Kelengkapan dasar (Tier 1)</span>
            <span>{completenessTier1?.percentage ?? 0}%</span>
          </div>
          <Progress value={completenessTier1?.percentage ?? 0} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Kelengkapan penuh (Tier 2)</span>
            <span>{completenessTier2?.percentage ?? 0}%</span>
          </div>
          <Progress value={completenessTier2?.percentage ?? 0} />
        </div>
      </div>

      {/* ---------------- Data Dasar (Tier 1) ---------------- */}
      <section className="space-y-4">
        <h3 className="font-medium">Data Dasar</h3>

        <div className="space-y-2">
          <Label htmlFor="business-role">Anda seorang...</Label>
          <Select
            value={businessRoleId ?? undefined}
            onValueChange={(v) => {
              setBusinessRoleId(v);
              // Reset role_details saat ganti role, supaya tidak
              // menyimpan field dari role lama yang sudah tidak relevan.
              setRoleDetails({});
            }}
          >
            <SelectTrigger id="business-role">
              <SelectValue placeholder="Pilih role" />
            </SelectTrigger>
            <SelectContent>
              {businessRoles.length === 0 ? (
                <SelectItem value="__empty" disabled>
                  Data tidak tersedia
                </SelectItem>
              ) : (
                businessRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="first-name">Nama Lengkap</Label>
          <Input
            id="first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Nama lengkap"
          />
        </div>

        <div className="space-y-2">
          <Label>Nomor Telepon/WA</Label>
          <p className="text-sm text-muted-foreground">
            {phoneConfirmedAt
              ? `Terverifikasi pada ${new Date(phoneConfirmedAt).toLocaleDateString("id-ID")}`
              : "Belum terverifikasi — fitur verifikasi nomor telepon belum aktif."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address-line">Alamat</Label>
          <Input
            id="address-line"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Nama jalan, nomor, RT/RW"
          />
        </div>

        <WilayahSelector
          initialDesaId={wilayah.desaId}
          onChange={setWilayah}
        />
      </section>

      {/* ---------------- Lengkapi Profil (Tier 2 umum) ---------------- */}
      <section className="space-y-4">
        <h3 className="font-medium">Lengkapi Profil</h3>

        <div className="space-y-2">
          <Label htmlFor="avatar-url">Foto Profil (URL)</Label>
          <Input
            id="avatar-url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook-url">Facebook</Label>
          <Input
            id="facebook-url"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://facebook.com/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram-url">Instagram</Label>
          <Input
            id="instagram-url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/..."
          />
        </div>
      </section>

      {/* ---------------- Field spesifik per role (table-driven) ---------------- */}
      {businessRoleId && tier2RoleSpecificRules.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-medium">Detail Tambahan</h3>
          {tier2RoleSpecificRules
            .filter(isRuleVisible)
            .map((rule) => {
              const inputType = FIELD_INPUT_TYPE[rule.field_key] ?? "text";
              const value = roleDetails[rule.field_key] ?? "";

              if (inputType === "yesno") {
                return (
                  <div key={rule.id} className="flex items-center gap-2">
                    <Checkbox
                      id={rule.field_key}
                      checked={value === "true"}
                      onCheckedChange={(checked) =>
                        setRoleDetailField(
                          rule.field_key,
                          checked === true ? "true" : "false"
                        )
                      }
                    />
                    <Label htmlFor={rule.field_key} className="cursor-pointer">
                      {rule.label}
                    </Label>
                  </div>
                );
              }

              return (
                <div key={rule.id} className="space-y-2">
                  <Label htmlFor={rule.field_key}>{rule.label}</Label>
                  <Input
                    id={rule.field_key}
                    type={inputType === "number" ? "number" : "text"}
                    value={value}
                    onChange={(e) =>
                      setRoleDetailField(rule.field_key, e.target.value)
                    }
                  />
                </div>
              );
            })}
        </section>
      )}

      {/* ---------------- Simpan ---------------- */}
      <div className="space-y-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
        {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      </div>
    </div>
  );
}