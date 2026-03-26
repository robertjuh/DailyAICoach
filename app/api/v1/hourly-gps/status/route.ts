import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { getUserToday } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        timezone: true,
        hourly_gps_enabled: true,
        hourly_gps_interval: true,
        hourly_gps_start_time: true,
        hourly_gps_end_time: true,
      },
    });

    if (!user || !user.hourly_gps_enabled) {
      return NextResponse.json({
        data: { enabled: false, isReady: false, minutesUntilReady: 0, inActiveWindow: false },
      });
    }

    const today = getUserToday(user.timezone ?? "UTC");

    // Get the most recent check-in today
    const lastCheckin = await prisma.hourlyCheckin.findFirst({
      where: { user_id: userId, date: today },
      orderBy: { time: "desc" },
      select: { time: true },
    });

    // Check if we're in the active window
    const now = new Date();
    const userTimeStr = now.toLocaleTimeString("en-GB", {
      timeZone: user.timezone ?? "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const startTime = user.hourly_gps_start_time ?? "09:00";
    const endTime = user.hourly_gps_end_time ?? "18:00";
    const inActiveWindow = userTimeStr >= startTime && userTimeStr <= endTime;

    // Calculate readiness
    let isReady = false;
    let minutesUntilReady = 0;

    if (inActiveWindow) {
      if (!lastCheckin) {
        // No check-in yet today — ready immediately
        isReady = true;
      } else {
        const elapsed = (now.getTime() - lastCheckin.time.getTime()) / 60000;
        const interval = user.hourly_gps_interval;
        if (elapsed >= interval) {
          isReady = true;
        } else {
          minutesUntilReady = Math.ceil(interval - elapsed);
        }
      }
    }

    return NextResponse.json({
      data: { enabled: true, isReady, minutesUntilReady, inActiveWindow },
    });
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
