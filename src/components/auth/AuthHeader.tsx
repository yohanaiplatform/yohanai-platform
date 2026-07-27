import Link from "next/link";

interface AuthHeaderProps {
  title: string;
  description?: string;
  logo?: React.ReactNode;
}

export function AuthHeader({
  title,
  description,
  logo,
}: AuthHeaderProps) {
  return (
    <div className="mb-8 text-center">
      {logo && <div className="mb-6 flex justify-center">{logo}</div>}

      <h1 className="text-2xl font-bold tracking-tight">
        {title}
      </h1>

      {description && (
        <p className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
      )}

      <div className="mt-4">
        <Link
          href="/"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}