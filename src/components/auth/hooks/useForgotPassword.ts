"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function useForgotPassword() {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendResetLink(email: string) {
    setLoading(true);
    setSuccess(false);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return false;
    }

    setSuccess(true);
    return true;
  }

  function resetState() {
    setLoading(false);
    setSuccess(false);
    setError(null);
  }

  return {
    sendResetLink,
    resetState,
    loading,
    success,
    error,
    setError,
  };
}