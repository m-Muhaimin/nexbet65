// Pure DTO types shared between the P2P API and the client components.
// No runtime code here — safe to import from client bundles.

export type AgentWalletDTO = {
  id: number;
  walletType: string;
  walletNumber: string;
  holderName: string;
  isPrimary: boolean;
  usableAfter: string;
};

export type AgentDTO = {
  agentCode: string;
  status: string;
  floatBalance: number;
  currency: string;
  successRate: number;
  avgResponseSec: number;
  totalTxns: number;
  isOnline: boolean;
  registeredAt: string;
  wallets: AgentWalletDTO[];
};

export type PlayerProof = {
  transactionId: string;
  senderAccount: string;
  sentAmount?: number | null;
  screenshotUrl?: string | null;
  note: string | null;
  submittedAt: string;
} | null;

export type TxnStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DENIED"
  | "EXPIRED"
  | "ESCALATED"
  | "ADMIN_APPROVED"
  | "ADMIN_REJECTED";

export type TxnDTO = {
  id: string;
  type: string;
  status: TxnStatus;
  requestedAmount: number;
  confirmedAmount: number | null;
  referenceCode: string | null;
  playerRef: string;
  playerProof: PlayerProof;
  assignedAt: string;
  completedAt: string | null;
  expiresAt: string;
  agentDeadline: string | null;
  canRespond: boolean;
};

export type PlayerP2PTxnDTO = {
  id: string;
  status: TxnStatus;
  requestedAmount: number;
  confirmedAmount: number | null;
  referenceCode: string | null;
  agentCode: string | null;
  assignedAt: string;
  completedAt: string | null;
  expiresAt: string;
};

export type LedgerRow = {
  id: number;
  txnType: string;
  amount: number;
  balanceAfter: number;
  referenceId: string | null;
  status: string | null;
  createdAt: string;
};

export type DashboardMetrics = {
  pending: number;
  todayVolume: number;
  todayCount: number;
  successRate: number;
  avgResponseSec: number;
  totalTxns: number;
};

export type DashboardResponse = {
  ok: boolean;
  agent: AgentDTO;
  queue: TxnDTO[];
  history: TxnDTO[];
  ledger: LedgerRow[];
  pendingTopups: { id: number; referenceId: string | null; amount: number; createdAt: string }[];
  metrics: DashboardMetrics;
};

export type EscalatedTxnDTO = {
  id: string;
  playerRef: string;
  agentCode: string | null;
  requestedAmount: number;
  playerProof: PlayerProof;
  assignedAt: string;
  escalatedAt: string;
  expiresAt: string;
};

export type AdminEscalationsResponse = {
  ok: boolean;
  escalations: EscalatedTxnDTO[];
};

export type AdminOverviewResponse = {
  ok: boolean;
  stats: {
    agents: number;
    onlineAgents: number;
    pendingTxns: number;
    pendingTopups: number;
    confirmedToday: number;
    volumeToday: number;
    totalVolume: number;
  };
  agents: {
    agentCode: string;
    status: string;
    floatBalance: number;
    successRate: number;
    totalTxns: number;
    isOnline: boolean;
    pendingCount: number;
    registeredAt: string;
    walletTypes: string[];
  }[];
  pendingTopups: {
    id: number;
    agentCode: string;
    referenceId: string | null;
    amount: number;
    createdAt: string;
  }[];
  recentTxns: {
    id: string;
    playerRef: string;
    agentCode: string | null;
    status: string;
    requestedAmount: number;
    confirmedAmount: number | null;
    createdAt: string;
  }[];
};

export type WsHello = {
  type: "hello";
  agentCode: string;
  status: string;
  queue: TxnDTO[];
  metrics: DashboardMetrics & { floatBalance: number; status: string };
  ts: number;
};

export type WsSync = {
  type: "sync";
  queue: TxnDTO[];
  metrics: DashboardMetrics & { floatBalance: number; status: string };
  ts: number;
};

export type WsPong = {
  type: "pong";
  ts: number;
};

export type WsError = {
  type: "error";
  code: string;
};
