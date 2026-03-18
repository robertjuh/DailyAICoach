import { prisma } from "@/lib/db/client";
import type { MemoryCat } from "@prisma/client";

export async function getMemoriesByUser(
  userId: string,
  limit = 10,
  category?: MemoryCat
) {
  return prisma.memoryEntry.findMany({
    where: {
      user_id: userId,
      ...(category ? { category } : {}),
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    orderBy: { relevance: "desc" },
    take: limit,
  });
}

export async function createMemory(data: {
  user_id: string;
  category: MemoryCat;
  content: string;
  source: string;
  expires_at?: Date;
}) {
  return prisma.memoryEntry.create({ data });
}

export async function decayMemories() {
  // Reduce relevance for CONTEXT and PATTERN memories over time
  await prisma.memoryEntry.updateMany({
    where: {
      category: "CONTEXT",
      relevance: { gt: 0 },
    },
    data: {
      relevance: { decrement: 0.05 },
    },
  });

  await prisma.memoryEntry.updateMany({
    where: {
      category: "PATTERN",
      relevance: { gt: 0 },
    },
    data: {
      relevance: { decrement: 0.01 },
    },
  });

  // Delete expired memories
  await prisma.memoryEntry.deleteMany({
    where: {
      expires_at: { lt: new Date() },
    },
  });
}
