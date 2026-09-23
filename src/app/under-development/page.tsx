import Link from "next/link";
import { ArrowRight, Hammer, Lock } from "lucide-react";

export const metadata = {
  title: "Under Development — Yohan.AI",
  description:
    "Yohan.AI sedang dalam pengembangan. Pendaftaran akun baru ditutup sementara.",
  // Selama terkunci semua route mendarat di sini. Tanpa noindex, halaman ini
  // yang akan terindeks sebagai wajah brand di hasil pencarian.
  robots: { index: false, follow: false },
};

export default function UnderDevelopmentPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Hammer className="h-3.5 w-3.5" />
            Under Development
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Yohan.AI
            </h1>
            <p className="text-lg font-medium text-primary">
              Property Buyer Behavior Intelligence Platform
            </p>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              Platform ini sedang dalam tahap pengembangan aktif dan untuk
              sementara dipakai secara internal. Kami sedang merapikan fondasi
              produk sebelum dibuka sebagai layanan publik.
            </p>
            <p className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              Pendaftaran akun baru ditutup sementara
            </p>
            <p className="text-sm">
              Tertarik mencoba saat rilis? Hubungi kami di{" "}
              <a
                href="mailto:admin@yohanai.id"
                className="font-medium text-primary hover:underline"
              >
                admin@yohanai.id
              </a>
              .
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Masuk ke akun yang sudah terdaftar
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div>
            <p className="text-sm font-semibold">
              © 2026 YohanAI. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Merek dagang dari Yohan Benyamin Betty
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/data-deletion"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Data Deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
