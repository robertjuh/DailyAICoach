import { prisma } from "@/lib/db/client";
import { getUserToday } from "@/lib/date-utils";

export async function buildContext(userId: string): Promise<string> {
  // Fetch user first for timezone-aware date computation
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const today = getUserToday(user?.timezone ?? "UTC");

  // Fetch all relevant data in parallel
  const [goals, memories, routine, logs, checkin, todayWatches, todayGps] = await Promise.all([

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
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
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
    prisma.checkIn.findFirst({
      where: { user_id: userId, date: today },
    }),

    // Today's watches
    prisma.watch.findMany({
      where: { user_id: userId, date: today },
    }),

    // Today's hourly GPS check-ins (safe fallback if table doesn't exist yet)
    prisma.hourlyCheckin?.findMany({
      where: { user_id: userId, date: today },
      orderBy: { time: "desc" },
      take: 5,
    }).catch(() => []) ?? Promise.resolve([]),
  ]);

  // Build formatted context string
  const sections: string[] = [];

  // User info
  if (user) {
    const profileLines = [
      `- Name: ${user.name ?? "Unknown"}`,
      `- Timezone: ${user.timezone}`,
      `- First Watch time: ${user.first_watch_time ?? "not set"}`,
      `- Night Watch time: ${user.night_watch_time ?? "not set"}`,
      `- Member since: ${user.created_at.toISOString().split("T")[0]}`,
    ];
    sections.push(`## User Profile\n${profileLines.join("\n")}`);
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

  // Today's watches
  if (todayWatches.length > 0) {
    const watchLines = todayWatches.map((w) => {
      const type = w.type === "FIRST_WATCH" ? "First Watch" : "Night Watch";
      const status = w.status === "confirmed" ? "confirmed" : "draft";
      const secs = w.sections as Record<string, unknown>;
      const summary = w.type === "FIRST_WATCH"
        ? `Focus: ${(secs.mission_focus as Record<string, string>)?.primary_focus ?? "not set"}`
        : `Theme: ${(secs.theme as string) ?? "not set"}`;
      return `- ${type} (${status}): ${summary}`;
    }).join("\n");
    sections.push(`## Today's Watches\n${watchLines}`);
  }

  // Today's Hourly GPS
  if (todayGps.length > 0) {
    const lastCheckin = todayGps[0]; // most recent (ordered desc)
    const lastTime = lastCheckin.time.toLocaleTimeString("en-GB", {
      timeZone: user?.timezone ?? "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    sections.push(
      `## Today's Hourly GPS\n- Check-ins today: ${todayGps.length}\n- Last check-in: ${lastTime} — ${lastCheckin.working_on}${lastCheckin.energy ? ` (energy: ${lastCheckin.energy}/5)` : ""}`
    );
  }

  return sections.join("\n\n");
}
