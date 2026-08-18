import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

/**
 * Official-looking brand marks for the NexBet65 payment methods. Rendered inline
 * so they always load, scale cleanly, and work in dark UI.
 */
export function PaymentMethodIcon({
  id,
  className,
}: {
  id?: string | null;
  className?: string;
}) {
  switch (id) {
    case "bkash":
      return <BkashIcon className={className} />;
    case "nagad":
      return <NagadIcon className={className} />;
    case "bank":
      return <BankIcon className={className} />;
    case "usdt":
      return <UsdtIcon className={className} />;
    case "usdc":
      return <UsdcIcon className={className} />;
    default:
      return <span className={cn("inline-block bg-white/5", className)} />;
  }
}

function BkashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="bKash">
      <rect width="48" height="48" rx="12" fill="#e2136e" />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontSize="19"
        fontWeight="700"
        fontStyle="italic"
        fill="#fff"
      >
        bKash
      </text>
    </svg>
  );
}

function NagadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="Nagad">
      <rect width="48" height="48" rx="12" fill="#f6921e" />
      <circle cx="24" cy="24" r="13" fill="none" stroke="#fff" strokeWidth="2.5" />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontSize="17"
        fontWeight="800"
        fill="#fff"
      >
        n
      </text>
    </svg>
  );
}

function BankIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="Bank">
      <rect width="48" height="48" rx="12" fill="#1e293b" />
      <rect width="48" height="48" rx="12" fill="none" stroke="#334155" strokeWidth="2" />
      <path
        d="M9 21 24 10l15 11h-4v12h4v4H9v-4h4V21H9Z"
        fill="#f8fafc"
      />
      <path d="M17 21v12M24 21v12M31 21v12" stroke="#94a3b8" strokeWidth="2.5" />
    </svg>
  );
}

function UsdtIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="USDT">
      <circle cx="24" cy="24" r="24" fill="#26a17b" />
      <circle cx="24" cy="24" r="18.5" fill="none" stroke="#53c5a3" strokeWidth="1.5" />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="#fff"
      >
        ₮
      </text>
    </svg>
  );
}

function UsdcIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="USDC">
      <circle cx="24" cy="24" r="24" fill="#2775ca" />
      <circle cx="24" cy="24" r="18.5" fill="none" stroke="#6aa5e0" strokeWidth="1.5" />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="#fff"
      >
        $
      </text>
    </svg>
  );
}
