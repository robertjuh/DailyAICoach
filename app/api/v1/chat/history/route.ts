import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { getUserToday } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    let date: Date;
    if (dateStr) {
      date = new Date(dateStr + "T00:00:00.000Z");
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });
      date = getUserToday(user?.timezone ?? "UTC");
    }

    const conversation = await prisma.conversation.findUnique({
      where: { user_id_date: { user_id: userId, date } },
      include: { messages: { orderBy: { created_at: "asc" } } },
    });

    return Response.json(
      { data: conversation?.messages ?? [] },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
