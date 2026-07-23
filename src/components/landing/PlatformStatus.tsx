export function PlatformStatus() {
  const statusItems = [
    { label: "Version", value: "Sprint 008" },
    { label: "Build", value: "Production Ready", badge: true },
    { label: "Framework", value: "Next.js 16" },
    { label: "Database", value: "Supabase" },
    { label: "Deployment", value: "Vercel" },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
            Platform Status
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {statusItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border bg-background p-4"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="inline-flex items-center rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                    {item.value}
                  </span>
                ) : (
                  <span className="text-sm font-semibold">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}