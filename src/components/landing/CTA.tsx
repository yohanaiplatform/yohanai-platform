import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-lg sm:px-12 sm:py-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to transform your property business?
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/80">
          Join property professionals who are closing more deals with AI-driven insights.
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-md bg-background px-8 text-sm font-medium text-primary shadow transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Access Platform
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}