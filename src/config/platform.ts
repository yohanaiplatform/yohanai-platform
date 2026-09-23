/**
 * Flag platform lock versi client.
 *
 * Sumber kebenaran penguncian ada di middleware (`src/lib/platform-lock.ts`)
 * yang membaca `PLATFORM_LOCKED`. Flag ini cuma untuk UI — menyembunyikan
 * tautan ke route yang sedang mati supaya user tidak diklik lalu kena redirect.
 *
 * Set berbarengan dengan `PLATFORM_LOCKED` agar tidak beda status.
 */
export const IS_PLATFORM_LOCKED =
  process.env.NEXT_PUBLIC_PLATFORM_LOCKED !== "false";
