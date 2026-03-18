import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { getActiveRoutine } from "@/lib/db/queries/routines";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const routine = await getActiveRoutine(userId);

    if (!routine) {
      return NextResponse.json(
        { error: "No active routine found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: routine }, { status: 200 });
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
