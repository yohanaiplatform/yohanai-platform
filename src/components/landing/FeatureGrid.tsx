import {
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  Brain,
  MessageSquare,
} from "lucide-react";

const features = [
  {
    title: "Executive Dashboard",
    description: "Real-time insights into buyer behavior and platform metrics.",
    icon: LayoutDashboard,
  },
  {
    title: "CRM Management",
    description: "Centralized lead tracking and relationship management.",
    icon: Users,
  },
  {
    title: "Property Management",
    description: "Comprehensive catalog and listing management tools.",
    icon: Building2,
  },
  {
    title: "Sales Pipeline",
    description: "Visualize and optimize your sales funnel from lead to close.",
    icon: TrendingUp,
  },
  {
    title: "AI Intelligence",
    description: "Predictive analytics and automated buyer behavior insights.",
    icon: Brain,
  },
  {
    title: "Communication Automation",
    description: "Seamless WhatsApp and email automation workflows.",
    icon: MessageSquare,
  },
];

export function FeatureGrid() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to scale
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete suite of tools designed for modern property professionals.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}