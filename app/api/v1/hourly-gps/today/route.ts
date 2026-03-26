import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { getUserToday } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const today = getUserToday(user?.timezone ?? "UTC");

    const checkins = await prisma.hourlyCheckin.findMany({
      where: { user_id: userId, date: today },
      orderBy: { time: "asc" },
    });

    return NextResponse.json({ data: checkins }, { status: 200 });
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
