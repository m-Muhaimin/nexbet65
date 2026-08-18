import type { Metadata } from "next";

import { P2PApp } from "@/components/p2p/p2p-app";

export const metadata: Metadata = {
  title: "P2P Agent Console",
  description: "Zero-verification P2P deposit agent console.",
};

export const dynamic = "force-dynamic";

export default function P2PPage() {
  return <P2PApp />;
}
