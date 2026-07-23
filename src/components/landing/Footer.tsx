import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold">© 2026 Yohan.AI</p>
          <p className="text-sm text-muted-foreground">
            Property Buyer Behavior Intelligence Platform
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}