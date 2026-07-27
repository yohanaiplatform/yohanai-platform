"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { AuthError } from "@/components/auth/AuthError";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { PasswordField } from "@/components/auth/PasswordField";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthCard>
        <AuthHeader
          title="Password Updated"
          description="Your password has been changed successfully."
        />

        <div className="space-y-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />

          <Link href="/login" className="block">
            <Button className="w-full">
              Sign In
            </Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Reset Password"
        description="Choose a new password for your account."
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <AuthError message={error} />

        <div className="space-y-2">
          <Label htmlFor="password">
            New Password
          </Label>

          <PasswordField
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password
          </Label>

          <PasswordField
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            required
          />
        </div>

        {loading ? (
          <AuthLoading text="Updating password..." />
        ) : (
          <Button
            type="submit"
            className="w-full"
          >
            Update Password
          </Button>
        )}

        <AuthFooter mode="forgot-password" />
      </form>
    </AuthCard>
  );
}