"use client";

// src/components/settings/BrandingCard.tsx
//
// Settings: logo dokumen dan watermark foto milik pengguna sendiri. Gambar diperiksa dulu di browser (umpan balik cepat)
// lalu diperiksa ulang oleh server; yang tidak sesuai standar ditolak dengan daftar alasan dan pengguna diminta mengedit
// ulang gambarnya. Watermark baru hanya berlaku untuk foto yang diunggah sesudahnya; foto lama tidak berubah.

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BRANDING_SPECS, specSummary, validateBrandingImage, type BrandingKind } from "@/lib/branding/spec";

interface AssetStatus {
  width: number;
  height: number;
  updatedAt: string;
}
interface BrandingStatus {
  watermark: AssetStatus | null;
  docLogo: AssetStatus | null;
}

/** Baca dimensi + bagian piksel transparan di browser. */
async function inspectInBrowser(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 240 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let transparentRatio = 0;
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 250) transparent += 1;
    transparentRatio = transparent / (data.length / 4);
  }
  return { width: bitmap.width, height: bitmap.height, transparentRatio };
}

function formatOf(file: File): "png" | "jpeg" | null {
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpeg";
  return null;
}

function Slot({
  kind,
  title,
  description,
  status,
  version,
  onChanged,
}: {
  kind: BrandingKind;
  title: string;
  description: string;
  status: AssetStatus | null;
  version: number;
  onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErrors(null);
    setOk(null);
    setBusy(true);
    try {
      let info;
      try {
        info = await inspectInBrowser(file);
      } catch {
        setErrors(["Gambar tidak bisa dibaca. Pastikan file PNG/JPG yang valid."]);
        return;
      }
      const reasons = validateBrandingImage(kind, {
        format: formatOf(file),
        width: info.width,
        height: info.height,
        bytes: file.size,
        hasAlpha: info.transparentRatio > 0,
        transparentRatio: info.transparentRatio,
      });
      if (reasons.length > 0) {
        setErrors(reasons);
        return;
      }
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file);
      const res = await fetch("/api/branding/upload", { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { error?: string; reasons?: string[] };
      if (!res.ok) {
        setErrors(json.reasons?.length ? json.reasons : [json.error ?? "Gagal mengunggah."]);
        return;
      }
      setOk(kind === "watermark" ? "Watermark tersimpan. Berlaku untuk foto yang diunggah mulai sekarang." : "Logo dokumen tersimpan. Langsung dipakai di MoU, Kwitansi, dan PPJB berikutnya.");
      onChanged();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setErrors(null);
    setOk(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/branding?kind=${kind}`, { method: "DELETE" });
      if (!res.ok) {
        setErrors(["Gagal menghapus. Coba lagi."]);
        return;
      }
      setOk(kind === "watermark" ? "Kembali memakai watermark bawaan." : "Logo dokumen dihapus; dokumen memakai nama kantor sebagai teks.");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const src = `/api/branding/file/${kind}?v=${version}`;

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium">Standar gambar</p>
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
          {specSummary(kind).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {kind === "watermark" ? (
        <div className="relative h-40 overflow-hidden rounded-lg" style={{ background: "linear-gradient(135deg,#7fa6c9,#c9d6b8 55%,#8a7a6a)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Pratinjau watermark"
            className="absolute left-1/2 top-1/2 w-[32%] -translate-x-1/2 -translate-y-1/2"
            style={{ opacity: 0.55, filter: "drop-shadow(0 0 6px rgba(0,0,0,0.6))" }}
          />
          <span className="absolute bottom-1 right-2 text-[10px] text-white/80">Pratinjau di atas foto contoh</span>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-white p-2">
          {status ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Logo dokumen" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Belum diatur -- dokumen memakai nama kantor sebagai teks</span>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {status ? `Terpasang: ${status.width} x ${status.height}px` : kind === "watermark" ? "Memakai watermark bawaan Yohan.AI" : "Belum ada logo"}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={BRANDING_SPECS[kind].formats.map((f) => (f === "png" ? "image/png" : "image/jpeg")).join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <Button type="button" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Memproses..." : status ? "Ganti gambar" : "Unggah gambar"}
        </Button>
        {status && (
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={remove}>
            Hapus (kembali ke bawaan)
          </Button>
        )}
      </div>

      {errors && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">Gambar ditolak. Edit ulang gambarnya lalu unggah lagi:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {ok && <p className="text-sm text-emerald-600">{ok}</p>}
    </div>
  );
}

export function BrandingCard() {
  const [status, setStatus] = useState<BrandingStatus | null>(null);
  const [version, setVersion] = useState(1);

  // version naik setiap gambar berubah: memicu muat ulang status dan mengganti penanda versi URL gambar (cache browser).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/branding", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json) setStatus(json as BrandingStatus);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [version]);

  function changed() {
    setVersion((v) => v + 1);
  }

  if (!status) return <p className="text-sm text-muted-foreground">Memuat...</p>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Logo dan watermark ini khusus akun Anda. Foto yang sudah diunggah sebelumnya tetap memakai watermark lamanya; perubahan hanya berlaku untuk foto yang
        diunggah sesudahnya.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Slot
          kind="logo"
          title="Logo dokumen"
          description="Muncul di header MoU, Kwitansi, dan PPJB."
          status={status.docLogo}
          version={version}
          onChanged={changed}
        />
        <Slot
          kind="watermark"
          title="Watermark foto"
          description="Ditempel otomatis di tengah setiap foto listing baru yang Anda unggah."
          status={status.watermark}
          version={version}
          onChanged={changed}
        />
      </div>
    </div>
  );
}
