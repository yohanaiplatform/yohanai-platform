import { Suspense } from "react";
import { redirect } from "next/navigation";

import { isPlatformLocked, LOCK_NOTICE_PATH } from "@/lib/platform-lock";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  // Lapis kedua di belakang middleware: kalau matcher middleware berubah,
  // form registrasi tetap tidak pernah ter-render selama platform terkunci.
  if (isPlatformLocked()) {
    redirect(LOCK_NOTICE_PATH);
  }

  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
