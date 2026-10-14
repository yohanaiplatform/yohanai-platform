// src/app/api/properties/documents/ppjb/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextPpjbNumber } from "@/lib/documents/assignPpjbNumber";
import { formatBirthInfo, parseParty2 } from "@/lib/documents/mouTypes";
import type { PpjbForm } from "@/lib/documents/ppjbTypes";
import type { Json } from "@/types/database";

/**
 * Simpan PPJB: nomor (otomatis berurutan per kode proyek, atau manual; simpan ulang nomor yang sama memperbarui dokumen itu,
 * nomor listing lain ditolak), identitas Penjual ke identitas pemilik listing (dipakai juga MoU), isian tetap Pihak 2,
 * dan snapshot formulir (termasuk identitas Pembeli) ke riwayat dokumen -- tabel dilindungi RLS listing. Hak akses lewat client sesi user.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { listingId?: string; form?: PpjbForm; listing?: { title: string }; docNumber?: string } | null;
  if (!body?.listingId || !body.form || !body.listing) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

  const { data: listing } = await supabase.schema("property").from("listings").select("id").eq("id", body.listingId).is("deleted_at", null).maybeSingle();
  if (!listing) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });

  const form = body.form;
  if (!form.buyer.name.trim()) return NextResponse.json({ error: "Nama pembeli wajib diisi." }, { status: 400 });

  const party2 = parseParty2(form.party2);
  const admin = createAdminClient();

  const requested = (body.docNumber ?? "").trim().toUpperCase();
  if (requested && !/^[A-Z0-9][A-Z0-9/_-]{3,59}$/.test(requested)) {
    return NextResponse.json({ error: "Format nomor PPJB tidak valid, mis. PPJB/KPRMAS/IX/2026/0030." }, { status: 400 });
  }

  let docNumber = requested;
  let existingId: string | null = null;
  if (docNumber) {
    const { data: same } = await admin
      .schema("property")
      .from("documents")
      .select("id, listing_id")
      .eq("doc_type", "ppjb")
      .eq("doc_number", docNumber)
      .is("deleted_at", null)
      .limit(1);
    const row = same?.[0];
    if (row && row.listing_id !== listing.id) {
      return NextResponse.json({ error: `Nomor ${docNumber} sudah dipakai PPJB listing lain.` }, { status: 409 });
    }
    existingId = row?.id ?? null;
  } else {
    docNumber = await nextPpjbNumber(admin, form.docNumberProject || party2.listingPrefix);
  }

  const now = new Date().toISOString();

  // Identitas Penjual = pemilik listing (sama dengan Pihak 1 di MoU).
  const identity = await supabase
    .schema("property")
    .from("owner_identities")
    .upsert(
      {
        listing_id: listing.id,
        birth_info: formatBirthInfo(form.seller.birthPlace, form.seller.birthDate) || null,
        address: form.seller.address || null,
        id_number: form.seller.idNumber || null,
        created_by: user.id,
        updated_by: user.id,
        updated_at: now,
      },
      { onConflict: "listing_id" }
    );
  if (identity.error) return NextResponse.json({ error: "Gagal menyimpan identitas penjual" }, { status: 500 });

  const settings = await supabase
    .schema("property")
    .from("document_settings")
    .upsert({ user_id: user.id, data: party2 as unknown as Json, updated_at: now }, { onConflict: "user_id" });
  if (settings.error) return NextResponse.json({ error: "Gagal menyimpan isian tetap" }, { status: 500 });

  const payload = { form: { ...form, party2 }, listing: body.listing } as unknown as Json;

  if (existingId) {
    const { error } = await supabase.schema("property").from("documents").update({ data: payload }).eq("id", existingId);
    if (error) return NextResponse.json({ error: "Gagal memperbarui PPJB" }, { status: 500 });
    return NextResponse.json({ documentId: existingId, docNumber });
  }

  const { data: doc, error } = await supabase
    .schema("property")
    .from("documents")
    .insert({ listing_id: listing.id, doc_type: "ppjb", doc_number: docNumber, data: payload, created_by: user.id })
    .select("id")
    .single();
  if (error || !doc) return NextResponse.json({ error: "Gagal menyimpan PPJB" }, { status: 500 });

  return NextResponse.json({ documentId: doc.id, docNumber });
}
