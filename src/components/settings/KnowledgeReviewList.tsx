"use client";

// src/components/settings/KnowledgeReviewList.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export interface PendingEntry {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  submittedBy: string;
}

export interface PendingPlace {
  id: string;
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
  mapsUrl: string | null;
  submittedBy: string;
}

/** Daftar usulan menunggu persetujuan + tombol Setujui/Tolak (khusus kurator). */
export function KnowledgeReviewList({ entries, places }: { entries: PendingEntry[]; places: PendingPlace[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(kind: "entry" | "place", id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    const res = await fetch("/api/knowledge/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, action }),
    });
    setBusyId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Gagal memproses.");
      return;
    }
    router.refresh();
  }

  if (entries.length === 0 && places.length === 0) {
    return <p className="text-sm text-muted-foreground">Tidak ada usulan yang menunggu persetujuan.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {entries.map((entry) => (
        <div key={entry.id} className="space-y-2 rounded-lg border border-border p-4">
          <div className="text-xs text-muted-foreground">Pengetahuan -- diusulkan oleh {entry.submittedBy}</div>
          <div className="text-sm font-medium">{entry.title}</div>
          <div className="whitespace-pre-wrap text-sm">{entry.content}</div>
          {entry.keywords.length > 0 && <div className="text-xs text-muted-foreground">Kata kunci: {entry.keywords.join(", ")}</div>}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busyId === entry.id} onClick={() => review("entry", entry.id, "approve")}>
              Setujui
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={busyId === entry.id} onClick={() => review("entry", entry.id, "reject")}>
              Tolak
            </Button>
          </div>
        </div>
      ))}

      {places.map((place) => (
        <div key={place.id} className="space-y-2 rounded-lg border border-border p-4">
          <div className="text-xs text-muted-foreground">Titik peta -- diusulkan oleh {place.submittedBy}</div>
          <div className="text-sm font-medium">{place.name}</div>
          <div className="text-xs text-muted-foreground">
            {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
            {place.aliases.length > 0 && ` · ${place.aliases.join(", ")}`}
            {place.mapsUrl && (
              <>
                {" · "}
                <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  buka di Maps
                </a>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busyId === place.id} onClick={() => review("place", place.id, "approve")}>
              Setujui
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={busyId === place.id} onClick={() => review("place", place.id, "reject")}>
              Tolak
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
