import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationPreferencesForm } from "@/components/NotificationPreferencesForm";

export default async function NotificationPreferencesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Preferensi Notifikasi
        </h1>
        <p className="text-sm text-muted-foreground">
          Atur notifikasi mana saja yang ingin kamu terima.
        </p>
      </div>

      <NotificationPreferencesForm userId={user.id} />
    </div>
  );
}