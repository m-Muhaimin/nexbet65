import { Suspense } from "react";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[420px] animate-pulse rounded-lg border border-border bg-card/60" />
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
