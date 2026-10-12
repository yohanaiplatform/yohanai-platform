// src/app/api/admin/platform-access/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Kelola penanda "boleh melihat laporan & dashboard platform" (auth_ext.profiles.can_view_platform_reports) -- khusus
 * admin. Akun dengan penanda menerima Platform Report (email) dan bisa membuka /admin TANPA peran admin penuh
 * (tetap hanya melihat lead/listing miliknya sendiri). Admin sendiri tidak ditampilkan (sudah punya akses penuh).
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: isAdmin } = await supabase.schema("core").rpc("is_admin_or_above");
  if (!isAdmin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  const [{ data: usersPage }, { data: profiles }, { data: roles }] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin.schema("auth_ext").from("profiles").select("user_id, first_name, last_name, role_id, can_view_platform_reports"),
    admin.schema("core").from("roles").select("id, name"),
  ]);

  const roleName = new Map((roles ?? []).map((r) => [r.id, r.name]));
  const profileByUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const seen = new Set<string>();

  const users = [];
  for (const u of usersPage?.users ?? []) {
    if (seen.has(u.id) || !u.email) continue;
    seen.add(u.id);
    const profile = profileByUser.get(u.id);
    const role = profile?.role_id ? roleName.get(profile.role_id) : null;
    if (role === "admin" || role === "super_admin") continue; // sudah akses penuh
    users.push({
      userId: u.id,
      email: u.email,
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || null,
      enabled: Boolean(profile?.can_view_platform_reports),
    });
  }
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: { userId?: string; enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.userId || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "userId dan enabled wajib diisi" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .schema("auth_ext")
    .from("profiles")
    .update({ can_view_platform_reports: body.enabled })
    .eq("user_id", body.userId);
  if (error) return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  return NextResponse.json({ success: true });
}
