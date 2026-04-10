import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import { saveMemory } from "@/lib/ai/memory-service";

const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const goals = await prisma.goal.findMany({
      where: { user_id: userId },
      orderBy: [{ is_active: "desc" }, { created_at: "desc" }],
    });

    return Response.json({ data: goals }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Goals list error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { title } = parsed.data;

    const goal = await prisma.goal.create({
      data: {
        user_id: userId,
        title,
        is_active: true,
      },
    });

    await saveMemory(userId, "GOAL", `User wants to: ${title}`, "goals");

    return Response.json({ data: goal }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Goal create error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
