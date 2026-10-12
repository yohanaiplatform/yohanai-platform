// src/app/api/admin/access/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canViewPlatformDashboard } from "@/lib/admin/platformAccess";

/** Apakah akun yang login boleh melihat halaman Master Admin? (dipakai Sidebar untuk menampilkan menu). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ allowed: false });
  return NextResponse.json({ allowed: await canViewPlatformDashboard(supabase, user.id) });
}
