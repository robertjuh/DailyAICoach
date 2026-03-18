import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    const date = dateStr ? new Date(dateStr) : new Date();
    date.setHours(0, 0, 0, 0);

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
