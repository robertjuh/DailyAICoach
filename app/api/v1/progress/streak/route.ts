import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { calculateStreak } from "@/lib/db/queries/logs";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const streak = await calculateStreak(userId);

    return NextResponse.json({ data: { streak } }, { status: 200 });
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
