"use client";

// src/components/settings/BrandingCard.tsx
//
// Settings: logo dokumen dan watermark foto milik pengguna sendiri. Pengguna boleh mengunggah gambar apa saja: browser
// menyesuaikannya otomatis ke standar (hapus latar polos, potong tepi kosong, ukuran, proporsi) dengan pratinjau sebelum
// disimpan; server tetap memeriksa ulang hasilnya, dan gambar yang benar-benar tidak bisa disesuaikan ditolak dengan alasan. Watermark baru hanya berlaku untuk foto yang diunggah sesudahnya; foto lama tidak berubah.

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { specSummary, type BrandingKind } from "@/lib/branding/spec";
import { BrandingProcessError, processBrandingImage, type ProcessedImage } from "@/lib/branding/processImage";
import { LOGO_POSITIONS, WATERMARK_POSITIONS } from "@/lib/branding/branding";

interface AssetStatus {
  width: number;
  height: number;
  updatedAt: string;
}
interface BrandingStatus {
  watermark: AssetStatus | null;
  docLogo: AssetStatus | null;
  watermarkPosition: string;
  logoPosition: string | null;
}

interface PositionOption {
  value: string;
  label: string;
}

/** Letak pratinjau watermark di atas foto contoh (sama dengan hasil asli: pojok lebih kecil, jarak 4% dari tepi). */
function watermarkPreviewStyle(position: string): React.CSSProperties {
  const corner = position !== "center";
  const style: React.CSSProperties = { position: "absolute", width: corner ? "26%" : "32%", opacity: 0.55, filter: "drop-shadow(0 0 6px rgba(0,0,0,0.6))" };
  if (!corner) return { ...style, left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  return { ...style, [position.endsWith("left") ? "left" : "right"]: "4%", [position.startsWith("top") ? "top" : "bottom"]: "6%" };
}

function Slot({
  kind,
  title,
  description,
  status,
  version,
  onChanged,
  positions,
  position,
  onPosition,
}: {
  kind: BrandingKind;
  title: string;
  description: string;
  status: AssetStatus | null;
  version: number;
  onChanged: () => void;
  positions: readonly PositionOption[];
  position: string | null;
  onPosition: (value: string | null) => Promise<boolean>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState<ProcessedImage | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [removeBg, setRemoveBg] = useState(true);

  function clearPending() {
    setPending((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    setLastFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function runProcess(file: File, removeBackground: boolean) {
    setErrors(null);
    setOk(null);
    setBusy(true);
    try {
      const result = await processBrandingImage(file, kind, { removeBackground });
      setPending((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return result;
      });
    } catch (e) {
      setPending((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return null;
      });
      setErrors([e instanceof BrandingProcessError ? e.message : "Gambar tidak bisa diproses. Coba file lain."]);
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File) {
    setLastFile(file);
    await runProcess(file, removeBg);
  }

  async function confirmUpload() {
    if (!pending) return;
    setErrors(null);
    setOk(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", new File([pending.blob], `${kind}.${pending.mime === "image/png" ? "png" : "jpg"}`, { type: pending.mime }));
      const res = await fetch("/api/branding/upload", { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { error?: string; reasons?: string[] };
      if (!res.ok) {
        setErrors(json.reasons?.length ? json.reasons : [json.error ?? "Gagal mengunggah."]);
        return;
      }
      setOk(kind === "watermark" ? "Watermark tersimpan. Berlaku untuk foto yang diunggah mulai sekarang." : "Logo dokumen tersimpan. Langsung dipakai di MoU, Kwitansi, dan PPJB berikutnya.");
      clearPending();
      onChanged();
    } finally {
      setBusy(false);
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
        <p className="mb-1 text-xs font-medium">Unggah gambar berukuran apa saja -- aplikasi menyesuaikannya otomatis ke standar ini:</p>
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
          {specSummary(kind).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {kind === "watermark" ? (
        <div className="relative h-40 overflow-hidden rounded-lg" style={{ background: "linear-gradient(135deg,#7fa6c9,#c9d6b8 55%,#8a7a6a)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Pratinjau watermark" style={watermarkPreviewStyle(position ?? "center")} />
          <span className="absolute bottom-1 right-2 text-[10px] text-white/80">Pratinjau di atas foto contoh</span>
        </div>
      ) : (
        <div
          className={`flex h-24 items-center rounded-lg border border-dashed border-border bg-white p-2 ${position === "left" ? "justify-start" : position === "right" ? "justify-end" : "justify-center"}`}
        >
          {status ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Logo dokumen" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Belum diatur -- dokumen memakai nama kantor sebagai teks</span>
          )}
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-medium">Posisi {kind === "watermark" ? "watermark di foto" : "logo di header dokumen"}</p>
        <div className="flex flex-wrap gap-1.5">
          {positions.map((p) => (
            <Button
              key={p.value}
              type="button"
              size="sm"
              variant={position === p.value ? "default" : "outline"}
              disabled={busy}
              onClick={async () => {
                setErrors(null);
                setOk(null);
                setBusy(true);
                const saved = await onPosition(p.value);
                setBusy(false);
                if (saved) setOk(kind === "watermark" ? "Posisi watermark tersimpan. Berlaku untuk foto yang diunggah mulai sekarang." : "Posisi logo tersimpan. Berlaku di dokumen berikutnya.");
                else setErrors(["Gagal menyimpan posisi. Coba lagi."]);
              }}
            >
              {p.label}
            </Button>
          ))}
          {kind === "logo" && position && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await onPosition(null);
                setBusy(false);
              }}
            >
              Kembali ke bawaan dokumen
            </Button>
          )}
        </div>
        {kind === "logo" && !position && <p className="mt-1 text-xs text-muted-foreground">Belum dipilih: tiap dokumen memakai tata letak bawaannya.</p>}
      </div>

      <p className="text-xs text-muted-foreground">
        {status ? `Terpasang: ${status.width} x ${status.height}px` : kind === "watermark" ? "Memakai watermark bawaan Yohan.AI" : "Belum ada logo"}
      </p>

      {pending && (
        <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50/50 p-3">
          <p className="text-sm font-semibold">Pratinjau hasil penyesuaian ({pending.width} x {pending.height}px)</p>
          {kind === "watermark" ? (
            <div className="relative h-40 overflow-hidden rounded-lg" style={{ background: "linear-gradient(135deg,#7fa6c9,#c9d6b8 55%,#8a7a6a)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pending.url} alt="Pratinjau watermark baru" style={watermarkPreviewStyle(position ?? "center")} />
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pending.url} alt="Pratinjau logo baru" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          {pending.notes.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
              {pending.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={confirmUpload}>
              {busy ? "Menyimpan..." : "Pakai gambar ini"}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={clearPending}>
              Batal
            </Button>
          </div>
        </div>
      )}

      {kind === "watermark" && (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={removeBg}
            disabled={busy}
            onChange={(e) => {
              setRemoveBg(e.target.checked);
              if (lastFile) void runProcess(lastFile, e.target.checked);
            }}
          />
          Hapus latar belakang polos otomatis (untuk gambar yang berlatar putih/satu warna)
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
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
          <p className="font-semibold">Gambar belum bisa dipakai. Perbaiki gambarnya lalu unggah lagi:</p>
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

  async function savePosition(patch: { watermarkPosition?: string; logoPosition?: string | null }): Promise<boolean> {
    const res = await fetch("/api/branding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) setStatus((s) => (s ? { ...s, ...patch } : s));
    return res.ok;
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
          positions={LOGO_POSITIONS}
          position={status.logoPosition}
          onPosition={(v) => savePosition({ logoPosition: v })}
        />
        <Slot
          kind="watermark"
          title="Watermark foto"
          description="Ditempel otomatis di tengah setiap foto listing baru yang Anda unggah."
          status={status.watermark}
          version={version}
          onChanged={changed}
          positions={WATERMARK_POSITIONS}
          position={status.watermarkPosition}
          onPosition={(v) => savePosition({ watermarkPosition: v ?? "center" })}
        />
      </div>
    </div>
  );
}
