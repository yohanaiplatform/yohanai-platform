// src/components/shared/WhatsAppButton.tsx

import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";

interface WhatsAppButtonProps {
  phone: string | null;
  nama: string;
}

export function WhatsAppButton({ phone, nama }: WhatsAppButtonProps) {
  if (!phone) {
    return <span className="text-muted-foreground">-</span>;
  }

  const text = `Halo ${nama}, saya dari Yohan.AI ingin follow-up permintaan Anda.`;
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Hubungi lewat WhatsApp"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
    >
      <WhatsAppIcon className="h-4 w-4" />
    </a>
  );
}
