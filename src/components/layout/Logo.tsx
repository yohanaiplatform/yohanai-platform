import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "light" | "dark";
  showText?: boolean;
  className?: string;
};

// Dimensi asli tiap file wordmark (bukan dibulatkan) -- next/image pakai ini
// buat aspect-ratio CSS, jadi harus akurat supaya logo tidak melar/gepeng
// saat di-render di ukuran kecil (h-8 di header mobile, misalnya).
const LOGO_DIMENSIONS = {
  light: { width: 491, height: 228 },
  dark: { width: 459, height: 199 },
} as const;

export function Logo({
  variant = "light",
  showText = true,
  className,
}: LogoProps) {
  const src =
    variant === "dark"
      ? "/images/logo/logo-dark.png"
      : "/images/logo/logo-light.png";
  const { width, height } = LOGO_DIMENSIONS[variant];

  return (
    <Link href="/" aria-label="Yohan.AI">
      {showText ? (
        <Image
          src={src}
          alt="Yohan.AI"
          width={width}
          height={height}
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