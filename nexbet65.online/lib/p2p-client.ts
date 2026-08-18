// Client-side helpers for the P2P agent flow.

export const P2P_WS_URL =
  process.env.NEXT_PUBLIC_P2P_WS_URL ||
  "wss://ws-p2p.srv1010179.hstgr.cloud";

/** Stable device signature matching the server's sha256Hex(parts.join("|")).slice(0,40). */
export async function computeDeviceFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    navigator.language,
    navigator.platform ?? "",
  ];
  let id: string | null = null;
  try {
    id = localStorage.getItem("p2p_install_id");
    if (!id) {
      id =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("p2p_install_id", id);
    }
  } catch {}
  parts.push(id ?? "anon");
  const text = parts.join("|");
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 40);
}

export function formatTk(n: number): string {
  return "৳" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function expiresInLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expiring now";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}
