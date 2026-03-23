import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const count = await prisma.dim.count({
      where: { user_id: userId, status: "OPEN" },
    });

    return Response.json({ data: { count } }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
