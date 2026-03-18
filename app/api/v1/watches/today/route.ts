import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const watches = await prisma.watch.findMany({
      where: { user_id: userId, date: today },
      orderBy: { created_at: "asc" },
    });

    const firstWatch = watches.find((w) => w.type === "FIRST_WATCH") ?? null;
    const nightWatch = watches.find((w) => w.type === "NIGHT_WATCH") ?? null;

    return Response.json({ data: { firstWatch, nightWatch } }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Watch fetch error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
