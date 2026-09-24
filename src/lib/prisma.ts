// Prisma client singleton.
//
// Next.js hot-reloads modules in dev, which would otherwise build up a new
// PrismaClient (and a new connection pool) on every edit until Postgres refuses
// more connections. Caching it on globalThis keeps exactly one per process.
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  // Prisma 7 has no built-in query engine: a driver adapter supplies the
  // driver. PrismaNeon wraps @neondatabase/serverless, which speaks Postgres
  // over WebSockets/HTTP and so survives serverless cold starts well.
  // This uses the POOLED url; migrations use the direct one (prisma7.config.ts).
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
