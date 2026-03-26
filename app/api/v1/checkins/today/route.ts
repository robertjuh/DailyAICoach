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

    const checkin = await prisma.checkIn.findUnique({
      where: { user_id_date: { user_id: userId, date: today } },
    });

    if (!checkin) {
      return NextResponse.json(
        { data: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ data: checkin }, { status: 200 });
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
