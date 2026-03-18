import { prisma } from "@/lib/db/client";
import type { MemoryCat } from "@prisma/client";

const MEMORY_EXPIRY: Record<MemoryCat, number | null> = {
  GOAL: null, // never expires
  PREFERENCE: 365, // 1 year in days
  PATTERN: 90, // 90 days
  MILESTONE: 180, // 6 months
  CONTEXT: 7, // 7 days
};

export async function getRelevantMemories(userId: string, limit = 10) {
  return prisma.memoryEntry.findMany({
    where: {
      user_id: userId,
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    orderBy: { relevance: "desc" },
    take: limit,
  });
}

export async function saveMemory(
  userId: string,
  category: MemoryCat,
  content: string,
  source: string
) {
  const expiryDays = MEMORY_EXPIRY[category];
  let expires_at: Date | null = null;

  if (expiryDays !== null) {
    expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + expiryDays);
  }

  return prisma.memoryEntry.create({
    data: {
      user_id: userId,
      category,
      content,
      source,
      expires_at,
    },
  });
}

/**
 * Parses [MEMORY: CATEGORY: content] tags from AI responses and saves them.
 * Example: [MEMORY: GOAL: User wants to run a marathon]
 */
export async function extractAndSaveMemories(
  userId: string,
  responseText: string
) {
  const memoryRegex = /\[MEMORY:\s*(GOAL|PREFERENCE|PATTERN|MILESTONE|CONTEXT):\s*(.+?)\]/g;
  let match: RegExpExecArray | null;
  const saved: { category: MemoryCat; content: string }[] = [];

  while ((match = memoryRegex.exec(responseText)) !== null) {
    const category = match[1] as MemoryCat;
    const content = match[2].trim();

    await saveMemory(userId, category, content, "chat");
    saved.push({ category, content });
  }

  return saved;
}
