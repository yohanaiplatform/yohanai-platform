import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[55%_45%]">
      {/* Left Branding Panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-red-950 lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_45%)]" />

        <div className="relative z-10 p-16 text-white">
          <h1 className="max-w-md text-5xl font-bold leading-tight">
            Property Buyer Behavior Intelligence System
          </h1>

          <p className="mt-6 max-w-md text-lg text-white/80">
            CRM, AI Intelligence, WhatsApp Automation, Lead Management,
            dan Analytics untuk industri properti Indonesia.
          </p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex items-center justify-center bg-background p-6 lg:p-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}