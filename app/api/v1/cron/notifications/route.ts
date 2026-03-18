import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // TODO: Round 2+ — implement notification sending
  // 1. Query users where notify_enabled = true
  // 2. Check if it's within their notify_time window (based on timezone)
  // 3. Check if they haven't completed their routine today
  // 4. Send push notification via Web Push or FCM

  return NextResponse.json(
    { data: { message: "Notification cron stub — no notifications sent" } },
    { status: 200 }
  );
}
