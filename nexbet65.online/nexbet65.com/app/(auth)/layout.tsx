import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="hero-radial pointer-events-none absolute inset-0"
      />
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-6 text-xs text-white/30">
        18+ · Play responsibly
      </p>
    </div>
  );
}
