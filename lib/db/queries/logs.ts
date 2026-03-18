import { prisma } from "@/lib/db/client";

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
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check backwards day by day
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);

    const logsForDay = await prisma.dailyLog.count({
      where: {
        user_id: userId,
        date: checkDate,
        completed: true,
      },
    });

    // Day counts if at least all items are completed
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
