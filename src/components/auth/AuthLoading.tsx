import { Loader2 } from "lucide-react";

interface AuthLoadingProps {
  text?: string;
}

export function AuthLoading({
  text = "Please wait...",
}: AuthLoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}