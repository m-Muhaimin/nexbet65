import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // Neon compute can be cold on first connection; default interactive txn
    // timeout (5s) is too tight for multi-statement money flows over the pooler.
    transactionOptions: { timeout: 20000, maxWait: 10000 },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Retry helper for Neon Postgres: the compute auto-suspends after idle and the
 * first query can throw a transient "Can't reach database server" error.
 */
export async function queryWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) {
        const msg = err instanceof Error ? err.message : "";
        const transient =
          /Can't reach database server|Connection terminated|ECONNRESET|ETIMEDOUT|connection pool/i.test(
            msg
          );
        if (!transient) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  throw lastErr;
}
