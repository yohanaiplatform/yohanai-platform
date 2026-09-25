"use client";

// src/components/layout/BreadcrumbLabels.tsx
//
// Breadcrumb generik (Breadcrumb.tsx) cuma title-case tiap segmen URL --
// untuk dynamic route (mis. /crm/<uuid>) itu bikin breadcrumb menampilkan
// UUID mentah alih-alih nama. Context ini biarkan halaman "mendaftarkan"
// label manusiawi untuk segmen URL-nya sendiri.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type LabelMap = Record<string, string>;

interface BreadcrumbLabelContextValue {
  labels: LabelMap;
  setLabel: (segment: string, label: string) => void;
}

const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue | null>(null);

export function BreadcrumbLabelProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<LabelMap>({});

  const setLabel = useCallback((segment: string, label: string) => {
    setLabels((prev) => (prev[segment] === label ? prev : { ...prev, [segment]: label }));
  }, []);

  return (
    <BreadcrumbLabelContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbLabelContext.Provider>
  );
}

export function useBreadcrumbLabels(): LabelMap {
  return useContext(BreadcrumbLabelContext)?.labels ?? {};
}

/**
 * Panggil dari halaman dynamic route (mis. crm/[id]/page.tsx) supaya
 * breadcrumb tampil nama, bukan UUID/slug mentah. `segment` adalah
 * potongan URL persis (mis. lead.id), `label` teks yang mau ditampilkan.
 */
export function SetBreadcrumbLabel({ segment, label }: { segment: string; label: string }) {
  const ctx = useContext(BreadcrumbLabelContext);

  useEffect(() => {
    if (ctx && label) ctx.setLabel(segment, label);
  }, [ctx, segment, label]);

  return null;
}
