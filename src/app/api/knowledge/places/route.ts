// src/app/api/knowledge/places/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMapsUrl } from "@/lib/geo/geo";
import { getCuratorUserIds, isKnowledgeCurator } from "@/lib/knowledge/curator";
import { createNotification } from "@/lib/notifications/createNotification";

/**
 * Kamus Kawasan: tambah / hapus titik. Diamankan sesi login; penulisan pakai service_role
 * setelah sesi diverifikasi (tabel knowledge tidak ditulis langsung dari browser).
 * Tambah: nama + alias + link Google Maps -> koordinat dibaca server (termasuk link pendek).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { action?: string; id?: string; name?: string; aliases?: string[]; mapsUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminClient();
  const curator = await isKnowledgeCurator(admin, user.id);

  if (body.action === "delete") {
    if (!curator) return NextResponse.json({ error: "Hanya kurator yang boleh menghapus titik" }, { status: 403 });
    if (!body.id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
    await admin.schema("knowledge").from("places").delete().eq("id", body.id);
    return NextResponse.json({ success: true });
  }

  const name = body.name?.trim();
  const mapsUrl = body.mapsUrl?.trim();
  if (!name || name.length < 3 || !mapsUrl) {
    return NextResponse.json({ error: "Nama (min 3 huruf) dan link Google Maps wajib diisi" }, { status: 400 });
  }

  const coords = await resolveMapsUrl(mapsUrl);
  if (!coords) {
    return NextResponse.json(
      { error: "Koordinat tidak terbaca dari link itu. Pakai tombol Bagikan di Google Maps, lalu tempel link-nya." },
      { status: 422 }
    );
  }

  const aliases = (body.aliases ?? []).map((a) => a.trim().toLowerCase()).filter((a) => a.length >= 3).slice(0, 10);

  // Nama unik tanpa membedakan huruf besar/kecil: hapus entri lama bernama sama (karakter % dan _ dibuang dari pola).
  await admin.schema("knowledge").from("places").delete().ilike("name", name.replace(/[%_]/g, ""));

  const { error } = await admin
    .schema("knowledge")
    .from("places")
    .insert({
      name,
      aliases,
      lat: coords.lat,
      lng: coords.lng,
      maps_url: mapsUrl,
      source: "manual",
      review_status: curator ? "approved" : "pending",
      submitted_by: user.id,
      created_by: user.id,
    });
  if (error) return NextResponse.json({ error: "Gagal menyimpan titik" }, { status: 500 });

  if (!curator) {
    const curatorIds = (await getCuratorUserIds(admin)).filter((id) => id !== user.id);
    await Promise.all(
      curatorIds.map((recipientId) =>
        createNotification(admin, {
          recipientId,
          type: "knowledge_review_requested",
          title: "Usulan titik peta menunggu persetujuan",
          body: `*${name}* -- buka Settings untuk menyetujui atau menolak.`,
          link: "/settings",
        })
      )
    );
  }

  return NextResponse.json({ success: true, lat: coords.lat, lng: coords.lng, pending: !curator });
}
