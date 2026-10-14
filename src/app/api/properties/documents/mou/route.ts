// src/app/api/properties/documents/mou/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureListingCode } from "@/lib/documents/assignListingCode";
import { parseParty2, type MouForm, type MouListingInfo } from "@/lib/documents/mouTypes";
import type { Json } from "@/types/database";

/**
 * Simpan MoU Pemasaran: (1) pastikan listing punya Listing ID resmi, (2) simpan identitas pemilik (tabel terpisah,
 * akses mengikuti listing), (3) simpan isian tetap Pihak 2 sebagai default berikutnya, (4) catat dokumen (snapshot
 * isi formulir) ke riwayat. Hak akses diperiksa lewat client SESI user: listing yang tidak boleh dilihatnya tidak ditemukan.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { listingId?: string; form?: MouForm; listing?: MouListingInfo; listingCode?: string } | null;
  if (!body?.listingId || !body.form || !body.listing) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const { data: listing } = await supabase
    .schema("property")
    .from("listings")
    .select("id, listing_code")
    .eq("id", body.listingId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!listing) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });

  const form = body.form;
  const party2 = parseParty2(form.party2);
  const admin = createAdminClient();
  // Listing ID: boleh diisi manual (mis. GDI/2026/12); kosong = pakai yang sudah ada atau buat otomatis berurutan.
  const requested = (body.listingCode ?? "").trim().toUpperCase();
  if (requested && !/^[A-Z0-9][A-Z0-9/_-]{2,39}$/.test(requested)) {
    return NextResponse.json({ error: "Format Listing ID tidak valid. Pakai huruf, angka, garis miring atau strip, mis. GDI/2026/12." }, { status: 400 });
  }
  let code: string | null = listing.listing_code;
  if (requested && requested !== listing.listing_code) {
    const { error: codeError } = await admin.schema("property").from("listings").update({ listing_code: requested }).eq("id", listing.id);
    if (codeError) {
      const dup = codeError.code === "23505";
      return NextResponse.json({ error: dup ? `Listing ID ${requested} sudah dipakai listing lain.` : "Gagal menyimpan Listing ID" }, { status: dup ? 409 : 500 });
    }
    code = requested;
  } else if (!code) {
    code = await ensureListingCode(admin, listing.id, party2.listingPrefix);
  }
  if (!code) return NextResponse.json({ error: "Gagal membuat Listing ID" }, { status: 500 });

  const now = new Date().toISOString();

  const identity = await supabase
    .schema("property")
    .from("owner_identities")
    .upsert(
      {
        listing_id: listing.id,
        birth_info: form.owner.birthInfo || null,
        address: form.owner.address || null,
        occupation: form.owner.occupation || null,
        id_number: form.owner.idNumber || null,
        id_photo: form.owner.idPhoto || null,
        created_by: user.id,
        updated_by: user.id,
        updated_at: now,
      },
      { onConflict: "listing_id" }
    );
  if (identity.error) return NextResponse.json({ error: "Gagal menyimpan identitas pemilik" }, { status: 500 });

  const settings = await supabase
    .schema("property")
    .from("document_settings")
    .upsert({ user_id: user.id, data: party2 as unknown as Json, updated_at: now }, { onConflict: "user_id" });
  if (settings.error) return NextResponse.json({ error: "Gagal menyimpan isian tetap" }, { status: 500 });

  const { data: doc, error } = await supabase
    .schema("property")
    .from("documents")
    .insert({
      listing_id: listing.id,
      doc_type: "mou_pemasaran",
      doc_number: code,
      // Foto KTP disimpan hanya di owner_identities (bukan di snapshot dokumen) supaya tidak digandakan.
      data: { form: { ...form, owner: { ...form.owner, idPhoto: "" } }, listing: body.listing } as unknown as Json,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !doc) return NextResponse.json({ error: "Gagal menyimpan dokumen" }, { status: 500 });

  return NextResponse.json({ documentId: doc.id, listingCode: code });
}
