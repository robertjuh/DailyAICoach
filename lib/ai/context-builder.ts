import { prisma } from "@/lib/db/client";

export async function buildContext(userId: string): Promise<string> {
  // Fetch all relevant data in parallel
  const [user, goals, memories, routine, logs, checkin] = await Promise.all([
    // User profile
    prisma.user.findUnique({ where: { id: userId } }),

    // Active goals
    prisma.goal.findMany({
      where: { user_id: userId, is_active: true },
      orderBy: { created_at: "desc" },
    }),

    // Top 10 relevant memories
    prisma.memoryEntry.findMany({
      where: {
        user_id: userId,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      orderBy: { relevance: "desc" },
      take: 10,
    }),

    // Active routine with items
    prisma.routine.findFirst({
      where: { user_id: userId, is_active: true },
      include: {
        items: { where: { is_active: true }, orderBy: { sort_order: "asc" } },
      },
    }),

    // Last 7 days of logs
    (() => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return prisma.dailyLog.findMany({
        where: {
          user_id: userId,
          date: { gte: sevenDaysAgo },
        },
        include: { routine_item: true },
        orderBy: { date: "desc" },
      });
    })(),

    // Today's check-in
    (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return prisma.checkIn.findFirst({
        where: { user_id: userId, date: today },
      });
    })(),
  ]);

  // Build formatted context string
  const sections: string[] = [];

  // User info
  if (user) {
    sections.push(
      `## User Profile\n- Name: ${user.name ?? "Unknown"}\n- Timezone: ${user.timezone}\n- Member since: ${user.created_at.toISOString().split("T")[0]}`
    );
  }

  // Goals
  if (goals.length > 0) {
    const goalList = goals.map((g) => `- ${g.title}`).join("\n");
    sections.push(`## Active Goals\n${goalList}`);
  }

  // Current routine
  if (routine) {
    const itemList = routine.items
      .map((i) => `- ${i.name} (${i.duration_minutes} min)`)
      .join("\n");
    sections.push(
      `## Current ${routine.type} Routine: ${routine.name}\n${itemList}`
    );
  }

  // Recent completion logs
  if (logs.length > 0) {
    const logsByDate = new Map<string, string[]>();
    for (const log of logs) {
      const dateStr = log.date.toISOString().split("T")[0];
      if (!logsByDate.has(dateStr)) {
        logsByDate.set(dateStr, []);
      }
      logsByDate.get(dateStr)!.push(log.routine_item.name);
    }

    const logLines = Array.from(logsByDate.entries())
      .map(([date, items]) => `- ${date}: completed ${items.join(", ")}`)
      .join("\n");
    sections.push(`## Last 7 Days Activity\n${logLines}`);
  }

  // Today's check-in
  if (checkin) {
    sections.push(
      `## Today's Check-in\n- Energy: ${checkin.energy}/5\n- Focus: ${checkin.focus}/5\n- Mood: ${checkin.mood}/5${checkin.note ? `\n- Note: ${checkin.note}` : ""}`
    );
  }

  // Memories
  if (memories.length > 0) {
    const memoryList = memories
      .map((m) => `- [${m.category}] ${m.content}`)
      .join("\n");
    sections.push(`## Relevant Memories\n${memoryList}`);
  }

  return sections.join("\n\n");
}
