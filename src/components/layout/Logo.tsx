import { Sparkles } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-bold text-xl text-primary">
      <Sparkles className="h-6 w-6" />
      <span>Yohan.AI</span>
    </div>
  );
}