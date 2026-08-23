import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountActions } from "@/components/profile/account-actions";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SystemInfo } from "@/components/profile/system-info";
import { EditProfileForm } from "@/components/EditProfileForm";

const EMPTY = "—";

function formatJoined(dateString: string | null | undefined) {
  if (!dateString) return EMPTY;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // auth_ext dan core belum termasuk di generated Database types,
  // jadi query di-cast manual. Jalankan `supabase gen types` nanti
  // untuk hilangkan cast ini.
  const { data: profile } = await (supabase as any)
    .schema("auth_ext")
    .from("profiles")
    .select("first_name, last_name, avatar_url, role_id, created_at")
    .eq("user_id", user.id)
    .single();

  let roleName = EMPTY;
  if (profile?.role_id) {
    const { data: role } = await (supabase as any)
      .schema("core")
      .from("roles")
      .select("name")
      .eq("id", profile.role_id)
      .single();
    if (role?.name) roleName = role.name;
  }

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    EMPTY;

  const userInformationFields = [
    { label: "Full Name", value: fullName },
    { label: "Email Address", value: user.email ?? EMPTY },
    { label: "Role", value: roleName },
    { label: "Phone", value: user.phone ?? EMPTY },
    { label: "Joined", value: formatJoined(profile?.created_at ?? user.created_at) },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your account information.
        </p>
      </div>

      <ProfileHeader
        name={fullName === EMPTY ? "User" : fullName}
        email={user.email ?? EMPTY}
        role={roleName === EMPTY ? "No Role Assigned" : roleName}
        status="active"
        avatarUrl={profile?.avatar_url ?? undefined}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ProfileCard title="User Information" fields={userInformationFields} />
          <SystemInfo />
        </div>
        <div className="flex flex-col gap-6">
          <AccountActions />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Edit Profil</h2>
        <EditProfileForm userId={user.id} />
      </div>
    </div>
  );
}