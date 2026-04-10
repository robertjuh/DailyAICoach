import { prisma } from "@/lib/db/client";
import { getUserToday } from "@/lib/date-utils";

export async function getLogsForDate(userId: string, date: Date) {
  return prisma.dailyLog.findMany({
    where: {
      user_id: userId,
      date,
    },
    include: { routine_item: true },
  });
}

export async function getLogsForDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.dailyLog.findMany({
    where: {
      user_id: userId,
      date: { gte: startDate, lte: endDate },
    },
    include: { routine_item: true },
    orderBy: { date: "asc" },
  });
}

export async function createLog(data: {
  user_id: string;
  routine_item_id: string;
  date: Date;
}) {
  return prisma.dailyLog.upsert({
    where: {
      user_id_routine_item_id_date: {
        user_id: data.user_id,
        routine_item_id: data.routine_item_id,
        date: data.date,
      },
    },
    update: { completed: true, completed_at: new Date() },
    create: {
      user_id: data.user_id,
      routine_item_id: data.routine_item_id,
      date: data.date,
      completed: true,
    },
  });
}

export async function createLogsInBatch(
  userId: string,
  items: { routine_item_id: string; date: Date }[]
) {
  const results = await Promise.all(
    items.map((item) =>
      createLog({
        user_id: userId,
        routine_item_id: item.routine_item_id,
        date: item.date,
      })
    )
  );
  return results;
}

export async function calculateStreak(userId: string): Promise<number> {
  // Get the active routine to know all items
  const routine = await prisma.routine.findFirst({
    where: { user_id: userId, is_active: true },
    include: { items: { where: { is_active: true } } },
  });

  if (!routine || routine.items.length === 0) return 0;

  const totalItems = routine.items.length;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const today = getUserToday(user?.timezone ?? "UTC");

  // Fetch last 365 days of logs in a single query, grouped by date
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 365);

  const dailyCounts = await prisma.dailyLog.groupBy({
    by: ["date"],
    where: {
      user_id: userId,
      date: { gte: startDate, lte: today },
      completed: true,
    },
    _count: { id: true },
  });

  // Build a map of date string -> count for O(1) lookup
  const countByDate = new Map<string, number>();
  for (const row of dailyCounts) {
    const dateStr = row.date.toISOString().split("T")[0];
    countByDate.set(dateStr, row._count.id);
  }

  // Check backwards day by day using the in-memory map
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];
    const logsForDay = countByDate.get(dateStr) ?? 0;

    if (logsForDay >= totalItems) {
      streak++;
    } else if (i === 0) {
      // Today isn't complete yet, that's okay — check yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}
