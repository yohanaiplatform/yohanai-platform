import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
      <div className="max-w-3xl space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Yohan.AI
        </h1>
        <p className="text-xl font-medium text-primary sm:text-2xl">
          Property Buyer Behavior Intelligence Platform
        </p>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          AI-powered CRM platform that helps property professionals understand buyer behavior, automate communication, and close more deals.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Access Platform
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="#"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Documentation
            <FileText className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}