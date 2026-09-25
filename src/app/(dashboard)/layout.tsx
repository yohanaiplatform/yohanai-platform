import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { getLocale } from "@/lib/i18n/getLocale";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <AuthGuard>
      <AppShell initialLocale={locale}>{children}</AppShell>
    </AuthGuard>
  );
}