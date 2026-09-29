// src/app/api/google-contacts/disconnect/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Putuskan sambungan Google Contacts milik user yang login -- cuma hapus baris di DB, tidak mencabut akses di sisi Google (user bisa cabut sendiri lewat myaccount.google.com/permissions kalau mau). */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .schema("auth_ext")
    .from("google_contacts_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
