// src/app/api/properties/documents/kwitansi/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextReceiptNumber } from "@/lib/documents/assignReceiptNumber";
import { parseParty2 } from "@/lib/documents/mouTypes";
import type { KwitansiForm, KwitansiListingInfo } from "@/lib/documents/kwitansiTypes";
import type { Json } from "@/types/database";

/**
 * Simpan Kwitansi Booking Unit: nomor kwitansi (otomatis berurutan, atau diisi manual), isian tetap penerima sebagai
 * default berikutnya, dan snapshot formulir ke riwayat dokumen. Menyimpan ulang dengan nomor yang sama MEMPERBARUI
 * kwitansi itu (bukan membuat duplikat); nomor yang sudah dipakai listing lain ditolak. Hak akses lewat client sesi user.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    listingId?: string;
    form?: KwitansiForm;
    listing?: KwitansiListingInfo;
    docNumber?: string;
  } | null;
  if (!body?.listingId || !body.form || !body.listing) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

  const { data: listing } = await supabase.schema("property").from("listings").select("id").eq("id", body.listingId).is("deleted_at", null).maybeSingle();
  if (!listing) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });

  const form = body.form;
  const amount = Number(String(form.payment.amount).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Nominal pembayaran wajib diisi." }, { status: 400 });

  const party2 = parseParty2(form.party2);
  const admin = createAdminClient();

  const requested = (body.docNumber ?? "").trim().toUpperCase();
  if (requested && !/^[A-Z0-9][A-Z0-9/_-]{2,39}$/.test(requested)) {
    return NextResponse.json({ error: "Format nomor kwitansi tidak valid, mis. KW/GDI/2026/001." }, { status: 400 });
  }

  let docNumber = requested;
  let existingId: string | null = null;
  if (docNumber) {
    const { data: same } = await admin
      .schema("property")
      .from("documents")
      .select("id, listing_id")
      .eq("doc_type", "kwitansi_booking")
      .eq("doc_number", docNumber)
      .is("deleted_at", null)
      .limit(1);
    const row = same?.[0];
    if (row && row.listing_id !== listing.id) {
      return NextResponse.json({ error: `Nomor ${docNumber} sudah dipakai kwitansi listing lain.` }, { status: 409 });
    }
    existingId = row?.id ?? null;
  } else {
    docNumber = await nextReceiptNumber(admin, party2.listingPrefix);
  }

  const settings = await supabase
    .schema("property")
    .from("document_settings")
    .upsert({ user_id: user.id, data: party2 as unknown as Json, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (settings.error) return NextResponse.json({ error: "Gagal menyimpan isian tetap" }, { status: 500 });

  const payload = { form: { ...form, party2 }, listing: body.listing } as unknown as Json;

  if (existingId) {
    const { error } = await supabase.schema("property").from("documents").update({ data: payload }).eq("id", existingId);
    if (error) return NextResponse.json({ error: "Gagal memperbarui kwitansi" }, { status: 500 });
    return NextResponse.json({ documentId: existingId, docNumber });
  }

  const { data: doc, error } = await supabase
    .schema("property")
    .from("documents")
    .insert({ listing_id: listing.id, doc_type: "kwitansi_booking", doc_number: docNumber, data: payload, created_by: user.id })
    .select("id")
    .single();
  if (error || !doc) return NextResponse.json({ error: "Gagal menyimpan kwitansi" }, { status: 500 });

  return NextResponse.json({ documentId: doc.id, docNumber });
}
