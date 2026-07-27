"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function useResetPassword() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resetPassword(
    password: string,
    confirmPassword: string
  ) {
    setLoading(true);
    setSuccess(false);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return false;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return false;
    }

    setSuccess(true);

    router.replace("/login");
    router.refresh();

    return true;
  }

  function resetState() {
    setLoading(false);
    setSuccess(false);
    setError(null);
  }

  return {
    resetPassword,
    resetState,
    loading,
    success,
    error,
    setError,
  };
}