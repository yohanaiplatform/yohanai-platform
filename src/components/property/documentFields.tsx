"use client";

// Input formulir dokumen (dipakai Kwitansi; MoU masih punya salinan lokal sendiri).

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DocTextField({
  label,
  value,
  onChange,
  placeholder,
  wide,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
  type?: string;
}) {
  return (
    <div className={`space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function DocChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
