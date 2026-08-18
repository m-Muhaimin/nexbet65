import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import type { TeamPermission } from "@/lib/team-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICES: Record<string, { unit: string; permission: TeamPermission }> = {
  aviator: { unit: "aviator-ws", permission: "aviator-server" },
  wheel: { unit: "wheel-ws", permission: "wheel-server" },
};

const encoder = new TextEncoder();

function sse(data: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const service = url.searchParams.get("service") ?? "";
  const linesParam = url.searchParams.get("lines");
  const lines = Math.min(
    Math.max(parseInt(linesParam ?? "200", 10) || 200, 20),
    2000
  );

  const svc = SERVICES[service];
  if (!svc) {
    return new Response("Unknown service", { status: 400 });
  }

  const ctx = await getAdminContext();
  if (!adminCan(ctx, svc.permission)) {
    return new Response("Not authorized", { status: 403 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      controller.enqueue(sse({ type: "ready", unit: svc.unit, service }));

      const child = spawn(
        "journalctl",
        ["-u", svc.unit, "-f", "-n", String(lines), "--no-pager", "-o", "short", "-q"],
        { stdio: ["ignore", "pipe", "pipe"] }
      );

      const rl = createInterface({ input: child.stdout });
      rl.on("line", (line) => {
        try {
          controller.enqueue(sse({ type: "line", text: line }));
        } catch {
          /* client gone */
        }
      });

      child.stderr.on("data", (d: Buffer) => {
        const text = String(d).trim();
        if (text) {
          try {
            controller.enqueue(sse({ type: "stderr", text }));
          } catch {
            /* client gone */
          }
        }
      });

      child.on("error", (err) => {
        try {
          controller.enqueue(
            sse({ type: "error", text: `journalctl failed: ${err.message}` })
          );
        } catch {
          /* ignore */
        }
        close();
      });

      child.on("exit", () => close());

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 10_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        try {
          child.kill("SIGKILL");
        } catch {
          /* ignore */
        }
        close();
      });
    },
    cancel() {
      /* aborted client-side */
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
