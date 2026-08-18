// Shared constants for the P2P deposit-matching platform (BDT).
// Durations can be overridden via env for faster test cycles; defaults are prod-safe.
export const P2P_CONFIG = {
  sessionTtlSec: 7 * 24 * 3600, // agent session cookie lifetime
  wsTicketTtlSec: 45, // WS ticket is single-use, short-lived
  matchExpiryMs: Number(process.env.P2P_MATCH_EXPIRY_MS || 10 * 60 * 1000), // matched txn auto-expires if agent doesn't respond
  agentSlaMs: Number(process.env.P2P_AGENT_SLA_MS || 5 * 60 * 1000), // agent SLA to respond after proof is submitted
  adminSlaMs: 30 * 60 * 1000, // admin SLA for the escalation queue
  proofTolerance: 0.1, // |sent - requested| / requested must be <= 10%
  depositMin: 100,
  depositMax: 10000,
  maxPendingPerAgent: 5, // queue cap before an agent stops receiving new matches
  floatTopupMin: 500,
  floatTopupMax: 50000,
  newWalletCooldownMs: 24 * 3600 * 1000, // freshly-bound wallet only becomes primary after 24h
  currencySymbol: "৳",
  currencyCode: "BDT",
} as const;

export const P2P_AGENT_SESSION_COOKIE = "p2p_agent_session";

export const P2P_WALLET_TYPES = ["bkash", "nagad", "bank", "usdt", "usdc"] as const;

export const AGENT_STATUS = {
  ACTIVE: "ACTIVE",
  PROBATION: "PROBATION",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
} as const;

export const TXN_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  DENIED: "DENIED",
  EXPIRED: "EXPIRED",
  ESCALATED: "ESCALATED",
  ADMIN_APPROVED: "ADMIN_APPROVED",
  ADMIN_REJECTED: "ADMIN_REJECTED",
} as const;

/** Statuses that represent a live, un-resolved deposit (money may still move). */
export const TXN_LIVE = [
  TXN_STATUS.PENDING,
  TXN_STATUS.ESCALATED,
] as const;

/** Statuses that end with the player being credited (screenshots must dedupe against these). */
export const TXN_PLAYER_CREDITED = [
  TXN_STATUS.CONFIRMED,
  TXN_STATUS.ADMIN_APPROVED,
] as const;
