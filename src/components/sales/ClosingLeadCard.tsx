"use client";

// src/components/sales/ClosingLeadCard.tsx

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import {
  DEFAULT_BERKAS_ITEMS,
  type ClosingChecklist,
  type ClosingChecklistItem,
} from "@/lib/sales/getSalesData";

interface ClosingLeadCardProps {
  leadId: string;
  nama: string;
  phone: string | null;
  metadata: Json;
  checklist: ClosingChecklist;
}

export function ClosingLeadCard({ leadId, nama, phone, metadata, checklist: initialChecklist }: ClosingLeadCardProps) {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [saving, setSaving] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [berkasOpen, setBerkasOpen] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");

  /**
   * Update optimistik (bukan router.refresh()) -- halaman Sales bisa
   * menampilkan ratusan lead sekaligus, refresh server-side penuh tiap
   * klik checkbox bikin scroll posisi user melompat balik ke atas.
   */
  async function persist(next: ClosingChecklist) {
    const previous = checklist;
    setSaving(true);
    setChecklist(next);

    const baseMetadata =
      typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) ? metadata : {};

    const supabase = createClient();
    const { error } = await supabase
      .schema("customer")
      .from("leads")
      .update({ metadata: { ...baseMetadata, closing_checklist: next } as unknown as Json })
      .eq("id", leadId);

    setSaving(false);
    if (error) {
      setChecklist(previous);
    }
  }

  const outstandingItems = checklist.berkas_items.filter((item) => !item.done).length;
  const berkasReady = checklist.berkas_submitted && outstandingItems === 0;
  const canMarkBastKunci = checklist.bast_kunci || (checklist.ppjb_signed && berkasReady);
  const doneCount = [checklist.ppjb_signed, berkasReady, checklist.bast_kunci].filter(Boolean).length;

  function togglePpjb() {
    if (saving) return;
    persist({ ...checklist, ppjb_signed: !checklist.ppjb_signed });
  }

  function toggleBerkasSubmitted() {
    if (saving) return;
    persist({ ...checklist, berkas_submitted: !checklist.berkas_submitted });
  }

  function toggleBastKunci() {
    if (saving || !canMarkBastKunci) return;
    persist({ ...checklist, bast_kunci: !checklist.bast_kunci });
  }

  function toggleKpr() {
    if (saving) return;
    persist({ ...checklist, is_kpr: !checklist.is_kpr });
  }

  /** Buka detail Berkas Lengkap -- kalau checklist-nya masih kosong, isi otomatis dari daftar dokumen KPR standar. */
  function toggleBerkasOpen() {
    const next = !berkasOpen;
    setBerkasOpen(next);
    if (next && checklist.berkas_items.length === 0) {
      const seeded: ClosingChecklistItem[] = DEFAULT_BERKAS_ITEMS.map((label, i) => ({
        id: `seed-${i}-${Date.now()}`,
        label,
        done: false,
      }));
      persist({ ...checklist, berkas_items: seeded });
    }
  }

  function addItem() {
    const label = newItemLabel.trim();
    if (!label || saving) return;
    const item: ClosingChecklistItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      done: false,
    };
    persist({ ...checklist, berkas_items: [...checklist.berkas_items, item] });
    setNewItemLabel("");
  }

  function toggleItem(id: string) {
    if (saving) return;
    persist({
      ...checklist,
      berkas_items: checklist.berkas_items.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    });
  }

  function removeItem(id: string) {
    if (saving) return;
    persist({ ...checklist, berkas_items: checklist.berkas_items.filter((item) => item.id !== id) });
  }

  const steps = [
    { done: checklist.ppjb_signed, label: "PPJB Ditandatangani", onClick: togglePpjb, disabled: saving },
    { done: berkasReady, label: "Berkas Lengkap", onClick: toggleBerkasOpen, disabled: false },
    {
      done: checklist.bast_kunci,
      label: checklist.is_kpr ? "BAST Kunci (Akad Notaris & Bank)" : "BAST Kunci (Akad Notaris)",
      onClick: toggleBastKunci,
      disabled: saving || !canMarkBastKunci,
    },
  ];

  const progressColor =
    doneCount === 0 ? "text-muted-foreground" : doneCount === 3 ? "text-blue-600 dark:text-blue-400" : "text-blue-500";

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCardOpen((v) => !v)}
            className="flex items-center gap-2 text-left"
          >
            {cardOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span>
              <span className="font-medium hover:underline">{nama}</span>
              <span className="block text-xs text-muted-foreground">{phone ?? "No HP tidak ada"}</span>
            </span>
          </button>
          <Link
            href={`/crm/${leadId}`}
            title="Buka Lead Detail"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${progressColor}`}>{doneCount}/3 langkah selesai</span>
          <WhatsAppButton phone={phone} nama={nama} />
        </div>
      </div>

      {cardOpen && (
        <>
          <div className="mt-4 flex items-center justify-end">
            <div className="flex items-center gap-1.5">
              <Checkbox id={`kpr-${leadId}`} checked={checklist.is_kpr} onCheckedChange={toggleKpr} disabled={saving} />
              <Label htmlFor={`kpr-${leadId}`} className="text-xs text-muted-foreground">
                Pembelian KPR
              </Label>
            </div>
          </div>

          <div className="mt-3 flex items-center">
            {steps.map((step, i) => (
              <div key={step.label} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={step.onClick}
                  disabled={step.disabled}
                  title={step.label}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    step.done
                      ? "border-blue-600 bg-blue-600 text-white"
                      : step.disabled
                        ? "border-muted bg-muted text-muted-foreground"
                        : "cursor-pointer border-blue-500 bg-white text-blue-600 hover:bg-blue-50 dark:bg-background dark:hover:bg-blue-950/40"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </button>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 ${step.done ? "bg-blue-600" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[11px] text-muted-foreground">
            {steps.map((step) => (
              <span key={step.label}>{step.label}</span>
            ))}
          </div>

          {berkasOpen && (
            <div className="mt-4 space-y-3 rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`berkas-${leadId}`}
                  checked={checklist.berkas_submitted}
                  onCheckedChange={toggleBerkasSubmitted}
                  disabled={saving}
                />
                <Label htmlFor={`berkas-${leadId}`} className="text-sm">
                  Berkas sudah disubmit
                </Label>
              </div>

              {checklist.berkas_items.length > 0 && (
                <ul className="space-y-1.5">
                  {checklist.berkas_items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={item.done}
                          onCheckedChange={() => toggleItem(item.id)}
                          disabled={saving}
                        />
                        <Label
                          htmlFor={`item-${item.id}`}
                          className={`text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}
                        >
                          {item.label}
                        </Label>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={saving}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Hapus
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <Input
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="Tambah dokumen lain (mis. surat keterangan lain)"
                  className="h-8 text-sm"
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem();
                    }
                  }}
                />
                <Button type="button" size="sm" variant="outline" onClick={addItem} disabled={saving}>
                  Tambah
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
