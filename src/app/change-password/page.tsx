import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Cek apakah user punya identity "email" (artinya pernah daftar/set
  // password email+password), atau cuma OAuth (mis. Google) yang tidak
  // punya password sama sekali.
  const hasPasswordAuth =
    user.identities?.some((identity) => identity.provider === "email") ??
    false;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ubah Password</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui password akun kamu untuk keamanan yang lebih baik.
        </p>
      </div>

      {hasPasswordAuth ? (
        <ChangePasswordForm email={user.email ?? ""} />
      ) : (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Akun kamu menggunakan Google Sign-In, jadi tidak ada password yang
          perlu diubah di sini. Kelola keamanan akun Google kamu langsung
          lewat pengaturan akun Google.
        </div>
      )}
    </div>
  );
}