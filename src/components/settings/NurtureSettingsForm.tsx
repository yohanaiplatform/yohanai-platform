"use client";

// src/components/settings/NurtureSettingsForm.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FOLLOW_UP_TEMPLATES } from "@/lib/whatsapp/followUpTemplates";
import {
  DEFAULT_NURTURE_SETTINGS,
  NURTURE_TEMPERATURE_OPTIONS,
  type NurtureSettings,
} from "@/lib/nurture/settings";

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

function NumberSelect({ id, value, options, suffix, onChange }: { id: string; value: number; options: number[]; suffix: string; onChange: (n: number) => void }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} className={selectClass}>
      {options.map((n) => (
        <option key={n} value={n}>
          {n} {suffix}
        </option>
      ))}
    </select>
  );
}

/**
 * Aturan follow-up otomatis (nurturing) milik akun ini: kapan lead dianggap diam, berapa kali dan sejauh apa
 * jeda, jam kirim, Temperature mana yang di-follow-up, dan template mana untuk kategori lead tertentu.
 */
export function NurtureSettingsForm() {
  const [s, setS] = useState<NurtureSettings | null>(null);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/nurture/settings");
        const data = await res.json();
        setS(data.settings ?? DEFAULT_NURTURE_SETTINGS);
        setMasterEnabled(data.masterEnabled !== false);
      } catch {
        setS(DEFAULT_NURTURE_SETTINGS);
      }
    })();
  }, []);

  if (!s) return <p className="text-sm text-muted-foreground">Memuat...</p>;

  const update = (patch: Partial<NurtureSettings>) => setS({ ...s, ...patch });

  function toggleTemp(t: string) {
    if (!s) return;
    const has = s.allowedTemperatures.includes(t);
    update({ allowedTemperatures: has ? s.allowedTemperatures.filter((x) => x !== t) : [...s.allowedTemperatures, t] });
  }

  async function save() {
    if (!s) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/nurture/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Gagal menyimpan.");
      } else {
        setS(data.settings);
        setMessage("Tersimpan. Berlaku mulai pengecekan berikutnya (tiap jam).");
      }
    } catch {
      setMessage("Gagal menyimpan.");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      {!masterEnabled && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Saklar utama follow-up otomatis di server sedang <strong>mati</strong> -- aturan di bawah tersimpan, tetapi belum ada pesan yang
          terkirim sampai saklar utama dinyalakan admin.
        </p>
      )}

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={s.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
        Follow-up otomatis aktif untuk lead saya
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="n-silence">Lead dianggap diam setelah</Label>
          <NumberSelect id="n-silence" value={s.silenceHours} options={[24, 36, 48, 72, 96, 120, 168]} suffix="jam" onChange={(n) => update({ silenceHours: n })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="n-gap">Jeda ke follow-up berikutnya</Label>
          <NumberSelect id="n-gap" value={s.stepGapDays} options={[2, 3, 4, 5, 7, 10, 14]} suffix="hari" onChange={(n) => update({ stepGapDays: n })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="n-max">Maksimal follow-up per lead</Label>
          <NumberSelect id="n-max" value={s.maxSteps} options={[1, 2, 3]} suffix="kali" onChange={(n) => update({ maxSteps: n })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="n-from">Jam kirim mulai (WIB)</Label>
          <NumberSelect id="n-from" value={s.sendHourStart} options={[6, 7, 8, 9, 10, 11, 12]} suffix=":00" onChange={(n) => update({ sendHourStart: n })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="n-to">Jam kirim sampai (WIB)</Label>
          <NumberSelect id="n-to" value={s.sendHourEnd} options={[16, 17, 18, 19, 20, 21, 22]} suffix=":00" onChange={(n) => update({ sendHourEnd: n })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Temperature lead yang di-follow-up</Label>
        <div className="flex flex-wrap gap-4">
          {NURTURE_TEMPERATURE_OPTIONS.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.allowedTemperatures.includes(t)} onChange={() => toggleTemp(t)} />
              {t}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Lead Hot (ditangani langsung oleh agen), Closing, dan Batal tidak pernah di-follow-up otomatis. Lead juga berhenti di-follow-up
          kalau membalas, atau pesan terakhirnya berisi penolakan.
        </p>
      </div>

      <div className="space-y-3">
        <Label>Template yang dipakai</Label>
        <div className="max-w-md space-y-2">
          <span className="text-xs text-muted-foreground">Template standar</span>
          <select value={s.defaultTemplate} onChange={(e) => update({ defaultTemplate: e.target.value })} className={selectClass}>
            {FOLLOW_UP_TEMPLATES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {s.templateRules.map((rule, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Kalau kategori/minat lead mengandung</span>
              <Input
                value={rule.keyword}
                onChange={(e) => update({ templateRules: s.templateRules.map((r, j) => (j === i ? { ...r, keyword: e.target.value } : r)) })}
                className="w-48"
                placeholder="mis. kapur mas"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">pakai template</span>
              <select
                value={rule.template}
                onChange={(e) => update({ templateRules: s.templateRules.map((r, j) => (j === i ? { ...r, template: e.target.value } : r)) })}
                className={`${selectClass} w-64`}
              >
                {FOLLOW_UP_TEMPLATES.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => update({ templateRules: s.templateRules.filter((_, j) => j !== i) })}>
              Hapus
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => update({ templateRules: [...s.templateRules, { keyword: "", template: FOLLOW_UP_TEMPLATES[0].name }] })}
          disabled={s.templateRules.length >= 10}
        >
          + Tambah aturan template
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Aturan"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setS(DEFAULT_NURTURE_SETTINGS)} disabled={saving}>
          Kembalikan ke standar
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        Setiap follow-up memakai template WhatsApp berbayar (dihitung per pesan oleh penyedia WhatsApp). Template baru harus disetujui Meta
        dulu sebelum bisa dipilih di sini.
      </p>
    </div>
  );
}
