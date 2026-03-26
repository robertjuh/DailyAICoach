import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { getActiveRoutine } from "@/lib/db/queries/routines";
import { getLogsForDateRange } from "@/lib/db/queries/logs";
import { prisma } from "@/lib/db/client";
import { getUserToday } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const [routine, user] = await Promise.all([
      getActiveRoutine(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      }),
    ]);
    if (!routine) {
      return NextResponse.json({ data: { items: [] } }, { status: 200 });
    }

    // Last 7 days
    const today = getUserToday(user?.timezone ?? "UTC");
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const logs = await getLogsForDateRange(userId, sevenDaysAgo, today);

    // Build a map of completed items per day
    const completedMap = new Map<string, Set<string>>();
    for (const log of logs) {
      const dateKey = log.date.toISOString().split("T")[0];
      if (!completedMap.has(dateKey)) {
        completedMap.set(dateKey, new Set());
      }
      completedMap.get(dateKey)!.add(log.routine_item_id);
    }

    // For each routine item, build 7-day completion array
    const items = routine.items.map((item) => {
      const days: { date: string; completed: boolean }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split("T")[0];
        days.push({
          date: dateKey,
          completed: completedMap.get(dateKey)?.has(item.id) ?? false,
        });
      }
      return {
        id: item.id,
        name: item.name,
        days,
      };
    });

    return NextResponse.json({ data: { items } }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
