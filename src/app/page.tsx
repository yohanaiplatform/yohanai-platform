import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { PlatformStatus } from "@/components/landing/PlatformStatus";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <PlatformStatus />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}