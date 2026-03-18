import { NextRequest, NextResponse } from "next/server";
import { decayMemories } from "@/lib/db/queries/memory";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    await decayMemories();
    return NextResponse.json(
      { data: { message: "Memory decay completed" } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Decay cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
