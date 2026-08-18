// P2P matching engine — realtime sync for the agent dashboard.
// Auth: ?ticket=<wsTicket> minted by POST /api/p2p/wsticket (45s TTL).
// Pushes: hello (auth + initial snapshot), sync (queue + metrics diffs),
// pong. The Next.js API handles confirm/deny; this engine polls every few
// seconds so the dashboard stays fresh without a pub/sub dependency.
// Run: node server/p2p-ws.js  (cwd = repo root so node_modules/.env resolve)
const { WebSocketServer } = require("ws");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

try {
  require("dotenv").config();
} catch {}
if (!process.env.DATABASE_URL) {
  const envFile = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

const PORT = Number(process.env.P2P_WS_PORT || 8091);
const POLL_MS = 5000;
const SWEEP_MS = 30000;
const HEARTBEAT_MS = 25000;

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const playerRef = (playerId) => "Player " + String(playerId).slice(-4).toUpperCase();

function txnDto(t) {
  return {
    id: t.id,
    type: t.type,
    status: t.status,
    requestedAmount: Number(t.requestedAmount),
    confirmedAmount: t.confirmedAmount === null ? null : Number(t.confirmedAmount),
    playerRef: playerRef(t.playerId),
    playerProof: t.playerProof,
    assignedAt: t.assignedAt.toISOString(),
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    expiresAt: t.expiresAt.toISOString(),
    canRespond: t.status === "PENDING",
  };
}

async function agentByTicket(ticket) {
  if (!ticket) return null;
  const session = await prisma.p2PAgentSession.findFirst({
    where: { wsTicket: sha256(ticket), wsTicketExpiresAt: { gt: new Date() } },
    include: { agent: true },
  });
  if (!session) return null;
  if (session.agent.status === "BANNED" || session.agent.status === "SUSPENDED") {
    return null;
  }
  return session.agent;
}

async function queueSnapshot(agentCode) {
  const rows = await prisma.p2PTransaction.findMany({
    where: { agentCode, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  return rows.map(txnDto);
}

async function metricsSnapshot(agentCode) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [today, agent, pending] = await Promise.all([
    prisma.p2PTransaction.findMany({
      where: { agentCode, status: "CONFIRMED", completedAt: { gte: todayStart } },
      select: { confirmedAmount: true },
    }),
    prisma.p2PAgent.findUnique({ where: { agentCode } }),
    prisma.p2PTransaction.count({ where: { agentCode, status: "PENDING" } }),
  ]);
  if (!agent) return null;
  return {
    pending,
    todayVolume: today.reduce((s, t) => s + Number(t.confirmedAmount ?? 0), 0),
    todayCount: today.length,
    successRate: Number(agent.successRate),
    avgResponseSec: agent.avgResponseSec,
    totalTxns: agent.totalTxns,
    floatBalance: Number(agent.floatBalance),
    status: agent.status,
  };
}

async function snapshot(agentCode) {
  const [queue, metrics] = await Promise.all([
    queueSnapshot(agentCode),
    metricsSnapshot(agentCode),
  ]);
  return { queue, metrics };
}

async function sweepExpired() {
  const res = await prisma.p2PTransaction.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED", completedAt: new Date() },
  });
  if (res.count > 0) {
    console.log(`[p2p-ws] expired ${res.count} stale transaction(s)`);
  }
}

async function sweepEscalations() {
  const res = await prisma.p2PTransaction.updateMany({
    where: {
      status: "PENDING",
      agentDeadline: { lt: new Date() },
      playerProof: { not: Prisma.DbNull },
    },
    data: { status: "ESCALATED", escalatedAt: new Date() },
  });
  if (res.count > 0) {
    console.log(`[p2p-ws] escalated ${res.count} proven-overdue transaction(s)`);
  }
}

const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });
const connCount = new Map();

async function poll() {
  for (const ws of wss.clients) {
    if (ws.readyState !== 1 || !ws.p2p) continue;
    try {
      const snap = await snapshot(ws.p2p.agentCode);
      if (!snap.metrics) continue;
      const msg = {
        type: "sync",
        queue: snap.queue,
        metrics: snap.metrics,
        ts: Date.now(),
      };
      const json = JSON.stringify(msg);
      if (json !== ws.p2p.lastSync) {
        ws.send(json);
        ws.p2p.lastSync = json;
      }
    } catch (err) {
      console.error("[p2p-ws] poll error", err.message);
    }
  }
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const ticket = url.searchParams.get("ticket");
  agentByTicket(ticket)
    .then(async (agent) => {
      if (!agent) {
        ws.send(JSON.stringify({ type: "error", code: "E_UNAUTHORIZED" }));
        ws.close(4001, "unauthorized");
        return;
      }
      const agentCode = agent.agentCode;
      ws.p2p = { agentCode, lastSync: "" };
      ws.isAlive = true;
      connCount.set(agentCode, (connCount.get(agentCode) || 0) + 1);
      await prisma.p2PAgent.update({
        where: { agentCode },
        data: { isOnline: true, lastActiveAt: new Date() },
      });
      const snap = await snapshot(agentCode);
      const hello = {
        type: "hello",
        agentCode,
        status: agent.status,
        queue: snap.queue,
        metrics: snap.metrics,
        ts: Date.now(),
      };
      ws.p2p.lastSync = JSON.stringify({ type: "sync", queue: snap.queue, metrics: snap.metrics, ts: hello.ts });
      ws.send(JSON.stringify(hello));
      console.log(`[p2p-ws] agent ${agentCode} connected`);

      ws.on("pong", () => {
        ws.isAlive = true;
      });
      ws.on("message", (data) => {
        try {
          const m = JSON.parse(data.toString());
          if (m.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
          }
        } catch {}
      });
      ws.on("close", () => {
        const n = (connCount.get(agentCode) || 1) - 1;
        if (n <= 0) {
          connCount.delete(agentCode);
          prisma.p2PAgent
            .update({ where: { agentCode }, data: { isOnline: false } })
            .catch(() => {});
          console.log(`[p2p-ws] agent ${agentCode} disconnected`);
        } else {
          connCount.set(agentCode, n);
        }
      });
      ws.on("error", (err) => {
        console.error("[p2p-ws] socket error", err.message);
      });
    })
    .catch((err) => {
      console.error("[p2p-ws] auth error", err.message);
      ws.close(1011, "internal error");
    });
});

const hb = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {}
  }
}, HEARTBEAT_MS);

let lastSweep = 0;
const loop = setInterval(async () => {
  await poll();
  if (Date.now() - lastSweep > SWEEP_MS) {
    lastSweep = Date.now();
    try {
      await sweepExpired();
      await sweepEscalations();
    } catch (err) {
      console.error("[p2p-ws] sweep error", err.message);
    }
  }
}, POLL_MS);

console.log(`[p2p-ws] listening on :${PORT}`);

process.on("SIGTERM", () => {
  clearInterval(hb);
  clearInterval(loop);
  wss.close();
  prisma.$disconnect();
  process.exit(0);
});
