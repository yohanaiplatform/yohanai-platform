// src/lib/crm/normalizePhone.ts

/** "0812..." -> "62812...", buang karakter non-digit. Dipakai intake endpoint & form manual. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}
