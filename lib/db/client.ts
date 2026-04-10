import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // Switch Supabase session-mode pooler (port 5432) to transaction-mode (port 6543)
  // Transaction mode releases server connections between queries, preventing pool exhaustion
  const adjustedUrl = connectionString?.replace(
    /pooler\.supabase\.com:5432/,
    "pooler.supabase.com:6543"
  );

  const pool = new Pool({
    connectionString: adjustedUrl,
    max: 5,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
