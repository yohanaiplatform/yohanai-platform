import Link from "next/link";

interface AuthFooterProps {
  mode: "login" | "register" | "forgot-password";
}

export function AuthFooter({ mode }: AuthFooterProps) {
  switch (mode) {
    case "login":
      return (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create Account
          </Link>
        </div>
      );

    case "register":
      return (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign In
          </Link>
        </div>
      );

    case "forgot-password":
      return (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Back to Login
          </Link>
        </div>
      );

    default:
      return null;
  }
}