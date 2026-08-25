"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordForm({ email }: { email: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toggle intip password, satu state terpisah per field supaya
  // user bisa buka satu tanpa otomatis membuka yang lain.
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validasi dasar di client SEBELUM hit ke server sama sekali.
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password baru tidak cocok.");
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage("Password baru harus berbeda dari password lama.");
      return;
    }

    setSubmitting(true);

    // LANGKAH 1: Re-autentikasi pakai password LAMA. Ini mencegah orang
    // yang cuma berhasil mencuri session (tanpa tahu password asli user)
    // bisa ganti password dan mengunci pemilik akun keluar.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (reauthError) {
      setSubmitting(false);
      setErrorMessage("Password lama salah.");
      return;
    }

    // LANGKAH 2: Baru boleh update ke password baru.
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSubmitting(false);

    if (updateError) {
      setErrorMessage(
        updateError.message.includes("should be different")
          ? "Password baru harus berbeda dari password lama."
          : `Gagal mengubah password: ${updateError.message}`
      );
      return;
    }

    setSuccessMessage("Password berhasil diubah.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    // Beri jeda sebentar supaya user sempat baca pesan sukses,
    // baru arahkan balik ke Profile.
    setTimeout(() => {
      router.push("/profile");
      router.refresh();
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Password Lama</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showCurrent ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">Password Baru</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Minimal {MIN_PASSWORD_LENGTH} karakter.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Menyimpan..." : "Ubah Password"}
      </Button>

      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      {successMessage && (
        <p className="text-sm text-green-600">
          {successMessage} Mengarahkan kembali ke Profile...
        </p>
      )}
    </form>
  );
}