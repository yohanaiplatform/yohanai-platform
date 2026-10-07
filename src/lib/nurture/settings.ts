// src/lib/nurture/settings.ts
// File polos (tanpa "use client") -- dipakai cron, route API, dan komponen client.

import { FOLLOW_UP_TEMPLATES } from "@/lib/whatsapp/followUpTemplates";
import type { Json } from "@/types/database";

/** Temperature yang boleh di-nurture. Hot (ditangani agen), Closing, dan Batal TIDAK pernah, apa pun pengaturannya. */
export const NURTURE_TEMPERATURE_OPTIONS = ["Belum ada", "Cold", "Warm"] as const;

export interface NurtureTemplateRule {
  keyword: string;
  template: string;
}

export interface NurtureSettings {
  enabled: boolean;
  silenceHours: number;
  stepGapDays: number;
  maxSteps: number;
  sendHourStart: number;
  sendHourEnd: number;
  allowedTemperatures: string[];
  defaultTemplate: string;
  templateRules: NurtureTemplateRule[];
}

/** Sama dengan perilaku sebelum aturan bisa diubah -- akun yang belum menyimpan apa pun memakai ini. */
export const DEFAULT_NURTURE_SETTINGS: NurtureSettings = {
  enabled: true,
  silenceHours: 48,
  stepGapDays: 5,
  maxSteps: 2,
  sendHourStart: 8,
  sendHourEnd: 20,
  allowedTemperatures: ["Belum ada", "Cold", "Warm"],
  defaultTemplate: "yohan_griya",
  templateRules: [{ keyword: "kapur mas", template: "follow_up_kapur_mas_t2" }],
};

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = typeof value === "number" ? Math.round(value) : Number.NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const TEMPLATE_NAMES: string[] = FOLLOW_UP_TEMPLATES.map((t) => t.name);

/** Rapikan input apa pun (dari form atau baris DB) jadi pengaturan yang valid dan aman. */
export function sanitizeNurtureSettings(input: unknown): NurtureSettings {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_NURTURE_SETTINGS;

  const sendHourStart = clamp(raw.sendHourStart, 6, 21, d.sendHourStart);
  const sendHourEnd = Math.max(sendHourStart + 1, clamp(raw.sendHourEnd, 7, 22, d.sendHourEnd));

  const temps = Array.isArray(raw.allowedTemperatures)
    ? (raw.allowedTemperatures as unknown[]).filter((t): t is string => (NURTURE_TEMPERATURE_OPTIONS as readonly string[]).includes(t as string))
    : d.allowedTemperatures;

  const defaultTemplate =
    typeof raw.defaultTemplate === "string" && TEMPLATE_NAMES.includes(raw.defaultTemplate) ? raw.defaultTemplate : d.defaultTemplate;

  const rules = Array.isArray(raw.templateRules)
    ? (raw.templateRules as unknown[])
        .map((r) => (typeof r === "object" && r !== null ? (r as Record<string, unknown>) : {}))
        .map((r) => ({ keyword: typeof r.keyword === "string" ? r.keyword.trim().toLowerCase().slice(0, 60) : "", template: r.template }))
        .filter((r): r is NurtureTemplateRule => r.keyword.length >= 2 && typeof r.template === "string" && TEMPLATE_NAMES.includes(r.template))
        .slice(0, 10)
    : d.templateRules;

  return {
    enabled: raw.enabled === undefined ? d.enabled : raw.enabled === true,
    silenceHours: clamp(raw.silenceHours, 24, 168, d.silenceHours),
    stepGapDays: clamp(raw.stepGapDays, 2, 14, d.stepGapDays),
    maxSteps: clamp(raw.maxSteps, 1, 3, d.maxSteps),
    sendHourStart,
    sendHourEnd,
    allowedTemperatures: Array.from(new Set(temps)),
    defaultTemplate,
    templateRules: rules,
  };
}

interface NurtureSettingsRow {
  enabled: boolean;
  silence_hours: number;
  step_gap_days: number;
  max_steps: number;
  send_hour_start: number;
  send_hour_end: number;
  allowed_temperatures: string[];
  default_template: string;
  template_rules: unknown;
}

export function settingsFromRow(row: NurtureSettingsRow): NurtureSettings {
  return sanitizeNurtureSettings({
    enabled: row.enabled,
    silenceHours: row.silence_hours,
    stepGapDays: row.step_gap_days,
    maxSteps: row.max_steps,
    sendHourStart: row.send_hour_start,
    sendHourEnd: row.send_hour_end,
    allowedTemperatures: row.allowed_temperatures,
    defaultTemplate: row.default_template,
    templateRules: row.template_rules,
  });
}

export function settingsToRow(s: NurtureSettings) {
  return {
    enabled: s.enabled,
    silence_hours: s.silenceHours,
    step_gap_days: s.stepGapDays,
    max_steps: s.maxSteps,
    send_hour_start: s.sendHourStart,
    send_hour_end: s.sendHourEnd,
    allowed_temperatures: s.allowedTemperatures,
    default_template: s.defaultTemplate,
    template_rules: s.templateRules as unknown as Json,
    updated_at: new Date().toISOString(),
  };
}

/** Template untuk satu lead: aturan kata kunci pertama yang cocok dengan kategori/minat lead, kalau tidak ada pakai template standar. */
export function pickNurtureTemplate(metadata: Record<string, unknown>, settings: NurtureSettings): string {
  const text = `${metadata.kategori ?? ""} ${metadata.minat_unit_lokasi ?? ""}`.toLowerCase();
  const rule = settings.templateRules.find((r) => text.includes(r.keyword));
  return rule?.template ?? settings.defaultTemplate;
}
