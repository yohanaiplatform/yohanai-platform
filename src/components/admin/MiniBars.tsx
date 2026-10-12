// src/components/admin/MiniBars.tsx
// Grafik batang sederhana (CSS, tanpa library) -- dipakai halaman Master Admin. Server-renderable.

export interface MiniBarPoint {
  label: string;
  value: number;
}

export function MiniBars({
  points,
  format = (n: number) => String(n),
  height = 96,
  barClassName = "bg-brand",
}: {
  points: MiniBarPoint[];
  format?: (n: number) => string;
  height?: number;
  barClassName?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((s, p) => s + p.value, 0);

  if (points.length === 0 || total === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data.</p>;
  }

  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {points.map((p, i) => (
          <div key={`${p.label}-${i}`} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${p.label}: ${format(p.value)}`}>
            <div
              className={`w-full rounded-t-sm ${barClassName} ${p.value === 0 ? "opacity-20" : ""}`}
              style={{ height: `${Math.max(p.value === 0 ? 2 : 6, (p.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{points[0].label}</span>
        <span>{points[Math.floor(points.length / 2)].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}
