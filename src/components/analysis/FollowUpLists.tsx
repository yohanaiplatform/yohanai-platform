// src/components/analysis/FollowUpLists.tsx

import { daysSince } from "@/lib/analysis/sendAnalysisEmail";
import type { FollowUpLead, FollowUpList } from "@/lib/analysis/types";

function FollowUpTable({ title, hint, list, total }: { title: string; hint: string; list: FollowUpLead[]; total: number }) {
  if (list.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold">
        {title} ({total.toLocaleString("id-ID")})
      </p>
      <p className="mb-1 text-xs text-muted-foreground">
        {hint}
        {total > list.length ? ` Ditampilkan ${list.length} dari ${total.toLocaleString("id-ID")}.` : ""}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-2 font-medium">Lead</th>
              <th className="py-1 pr-2 font-medium">Temperature</th>
              <th className="py-1 pr-2 font-medium">Pesan terakhir</th>
              <th className="py-1 pr-2 font-medium">Keberatan terakhir</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.leadId} className="border-t">
                <td className="py-1 pr-2">
                  <a className="text-blue-600 hover:underline dark:text-blue-400" href={l.slug ? `/crm/${encodeURIComponent(l.slug)}` : "/crm"}>
                    {l.name}
                  </a>
                </td>
                <td className="py-1 pr-2">{l.temperature}</td>
                <td className="py-1 pr-2">{daysSince(l.lastAt)}</td>
                <td className="py-1 pr-2 text-muted-foreground">{l.objection ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Tiga daftar lead yang perlu ditindaklanjuti (menunggu balasan, sepi, berhenti setelah keberatan). Dipakai Master Admin dan halaman Sales. */
export function FollowUpLists({ followUps }: { followUps: Partial<FollowUpList> | null | undefined }) {
  if (!followUps) return null;
  const totals = followUps.totals;
  const empty = !(totals?.waiting || totals?.stalled || totals?.objection);
  return (
    <div className="space-y-3">
      <FollowUpTable
        title="Menunggu balasan"
        hint="Pesan terakhir dari calon pembeli, belum dibalas lebih dari 2 jam. Paling mendesak."
        list={followUps.waiting ?? []}
        total={totals?.waiting ?? 0}
      />
      <FollowUpTable
        title="Sepi lebih dari 5 hari"
        hint="Hot/Warm yang tidak ada pesan sama sekali selama lebih dari 5 hari."
        list={followUps.stalled ?? []}
        total={totals?.stalled ?? 0}
      />
      <FollowUpTable
        title="Berhenti setelah menyatakan keberatan"
        hint="Warm/Cold, pesan terakhirnya berisi keberatan lalu sepi. Peluang reaktivasi."
        list={followUps.objection ?? []}
        total={totals?.objection ?? 0}
      />
      {empty && <p className="text-sm text-muted-foreground">Tidak ada lead yang perlu ditindaklanjuti dari percakapan 30 hari terakhir.</p>}
    </div>
  );
}
