import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { createHourlyCheckinSchema } from "@/lib/validators/hourly-gps";
import { prisma } from "@/lib/db/client";
import { getUserToday } from "@/lib/date-utils";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = createHourlyCheckinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const today = getUserToday(user?.timezone ?? "UTC");

    const checkin = await prisma.hourlyCheckin.create({
      data: {
        user_id: userId,
        date: today,
        time: new Date(),
        working_on: parsed.data.working_on,
        drift_note: parsed.data.drift_note,
        win: parsed.data.win,
        energy: parsed.data.energy,
        next_plan: parsed.data.next_plan,
      },
    });

    // If a DIM was captured, create it as a new DIM
    if (parsed.data.dim_capture) {
      await prisma.dim.create({
        data: {
          user_id: userId,
          content: parsed.data.dim_capture,
          category: "IDEA",
          status: "OPEN",
          source: "hourly-gps",
        },
      });
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
