import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "light" | "dark";
  showText?: boolean;
  className?: string;
};

export function Logo({
  variant = "light",
  showText = true,
  className,
}: LogoProps) {
  const src =
    variant === "dark"
      ? "/images/logo/logo-dark.png"
      : "/images/logo/logo-light.png";

  return (
    <Link href="/" aria-label="Yohan.AI">
      {showText ? (
        <Image
          src={src}
          alt="Yohan.AI"
          width={1600}
          height={400}
          priority
          className={cn("w-auto", className)}
        />
      ) : (
        <Image
          src="/images/logo/app-icon.png"
          alt="Yohan.AI"
          width={1024}
          height={1024}
          priority
          className={cn("w-auto", className)}
        />
      )}
    </Link>
  );
}