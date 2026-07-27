"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { AuthError } from "@/components/auth/AuthError";
import { AuthLoading } from "@/components/auth/AuthLoading";

export function ForgotPasswordForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Forgot Password"
        description="Enter your email to receive a password reset link."
      />

      {success ? (
        <div className="space-y-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />

          <div>
            <h2 className="text-lg font-semibold">
              Check your email
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a password reset link to your email
              address.
            </p>
          </div>

          <Link href="/login" className="block">
            <Button className="w-full">
                Back to Login
             </Button>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <AuthError message={error} />

          <div className="space-y-2">
            <Label htmlFor="email">
              Email
            </Label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="pl-10"
                required
              />
            </div>
          </div>

          {loading ? (
            <AuthLoading text="Sending reset link..." />
          ) : (
            <Button
              type="submit"
              className="w-full"
            >
              Send Reset Link
            </Button>
          )}

          <AuthFooter mode="forgot-password" />
        </form>
      )}
    </AuthCard>
  );
}