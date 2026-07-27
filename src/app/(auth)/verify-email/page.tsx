import Link from "next/link";
import { MailCheck } from "lucide-react";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Verify Your Email"
        description="We've sent a verification link to your email address."
      />

      <div className="space-y-6 text-center">
        <MailCheck className="mx-auto h-14 w-14 text-primary" />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Please check your inbox and click the verification link before signing in.
          </p>

          <p className="text-sm text-muted-foreground">
            If you don't see the email, check your spam folder.
          </p>
        </div>

        <Link href="/login" className="block">
          <Button className="w-full">
            Back to Login
          </Button>
        </Link>

        <Link href="/register" className="block">
          <Button
            variant="outline"
            className="w-full"
          >
            Register Again
          </Button>
        </Link>
      </div>
    </AuthCard>
  );
}