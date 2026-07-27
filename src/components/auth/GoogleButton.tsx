"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GoogleButtonProps {
  loading?: boolean;
  onClick?: () => void;
}

export function GoogleButton({
  loading = false,
  onClick,
}: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.75 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.67-2.26 1.07-3.72 1.07-2.86 0-5.29-1.93-6.16-4.53H2.17v2.84A11 11 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.12A6.61 6.61 0 0 1 5.5 12c0-.73.12-1.44.34-2.12V7.04H2.17A11 11 0 0 0 1 12c0 1.77.42 3.45 1.17 4.96l3.67-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.35c1.62 0 3.08.56 4.22 1.66l3.16-3.16C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.17 7.04l3.67 2.84C6.71 7.28 9.14 5.35 12 5.35z"
            />
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  );
}