import { prisma } from "@/lib/db/client";
import type { MemoryCat, DimCategory } from "@prisma/client";
import { analyzeDim } from "./priority-engine";

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

export async function updateGoalMemory(
  userId: string,
  oldTitle: string,
  newTitle: string
) {
  const existing = await prisma.memoryEntry.findFirst({
    where: {
      user_id: userId,
      category: "GOAL",
      content: `User wants to: ${oldTitle}`,
    },
  });

  if (existing) {
    return prisma.memoryEntry.update({
      where: { id: existing.id },
      data: { content: `User wants to: ${newTitle}` },
    });
  }
  return saveMemory(userId, "GOAL", `User wants to: ${newTitle}`, "goals");
}

export async function deleteGoalMemory(userId: string, goalTitle: string) {
  await prisma.memoryEntry.deleteMany({
    where: {
      user_id: userId,
      category: "GOAL",
      content: `User wants to: ${goalTitle}`,
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

/**
 * Parses [DIM: CATEGORY: content] tags from AI responses and saves them.
 * Example: [DIM: IDEA: Switch to a standing desk]
 */
export async function extractAndSaveDims(
  userId: string,
  responseText: string
) {
  const dimRegex = /\[DIM:\s*(DECISION|IDEA|MICRO_TASK):\s*(.+?)\]/g;
  let match: RegExpExecArray | null;
  const saved: { category: DimCategory; content: string }[] = [];

  while ((match = dimRegex.exec(responseText)) !== null) {
    const category = match[1] as DimCategory;
    const content = match[2].trim();

    const dim = await prisma.dim.create({
      data: {
        user_id: userId,
        content,
        category,
        source: "chat",
      },
    });

    // Run Priority Engine in background
    analyzeDim(dim.id, userId).catch((err) =>
      console.error("Priority Engine error for chat DIM:", err)
    );

    saved.push({ category, content });
  }

  return saved;
}
