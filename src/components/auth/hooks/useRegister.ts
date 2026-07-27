"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export function useRegister() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register(data: RegisterData) {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return false;
    }

    router.replace("/verify-email");
    router.refresh();

    return true;
  }

  async function registerWithGoogle() {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setGoogleLoading(false);

    if (error) {
      setError(error.message);
      return false;
    }

    return true;
  }

  return {
    register,
    registerWithGoogle,
    loading,
    googleLoading,
    error,
    setError,
  };
}