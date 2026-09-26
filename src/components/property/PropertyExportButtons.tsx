"use client";

// src/components/property/PropertyExportButtons.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PropertyFlyer, type PropertyFlyerData } from "@/components/property/PropertyFlyer";
import { exportFlyerAsJpg, exportFlyerAsPdf } from "@/lib/property/exportFlyer";

const FLYER_ID = "property-flyer-export";

interface PropertyExportButtonsProps {
  data: PropertyFlyerData;
  filenameBase: string;
}

/** Flyer promosi dirender tersembunyi di luar layar, cuma di-capture saat tombol diklik. */
export function PropertyExportButtons({ data, filenameBase }: PropertyExportButtonsProps) {
  const [exporting, setExporting] = useState<"jpg" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(kind: "jpg" | "pdf") {
    setExporting(kind);
    setError(null);
    try {
      if (kind === "jpg") {
        await exportFlyerAsJpg(FLYER_ID, `${filenameBase}.jpg`);
      } else {
        await exportFlyerAsPdf(FLYER_ID, `${filenameBase}.pdf`);
      }
    } catch {
      setError("Gagal membuat file. Coba lagi.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={exporting !== null}
          onClick={() => handleExport("jpg")}
        >
          {exporting === "jpg" ? "Membuat JPG..." : "Download JPG"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={exporting !== null}
          onClick={() => handleExport("pdf")}
        >
          {exporting === "pdf" ? "Membuat PDF..." : "Download PDF"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div style={{ position: "fixed", top: 0, left: -99999, zIndex: -1 }} aria-hidden="true">
        <PropertyFlyer id={FLYER_ID} data={data} />
      </div>
    </>
  );
}
