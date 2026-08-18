import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[360px] animate-pulse rounded-lg border border-border bg-card/60" />
      }
    >
      <SignInForm />
    </Suspense>
  );
}
