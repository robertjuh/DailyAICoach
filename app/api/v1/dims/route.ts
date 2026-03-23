import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import { analyzeDim } from "@/lib/ai/priority-engine";

const createDimSchema = z.object({
  content: z.string().min(1).max(1000),
  category: z.enum(["DECISION", "IDEA", "MICRO_TASK"]).optional(),
  source: z.enum(["manual", "chat", "watch"]).optional(),
  related_goal_id: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // OPEN, COMPLETED, etc.
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { user_id: userId };
    if (status) where.status = status;
    if (category) where.category = category;

    const dims = await prisma.dim.findMany({
      where,
      include: { related_goal: { select: { id: true, title: true } } },
      orderBy: [{ status: "asc" }, { priority_score: "desc" }, { created_at: "desc" }],
    });

    return Response.json({ data: dims }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("DIMs list error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = createDimSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { content, category, source, related_goal_id } = parsed.data;

    const dim = await prisma.dim.create({
      data: {
        user_id: userId,
        content,
        category: category ?? "IDEA",
        source: source ?? "manual",
        related_goal_id: related_goal_id ?? null,
      },
    });

    // Run Priority Engine analysis in the background (don't block response)
    analyzeDim(dim.id, userId).catch((err) =>
      console.error("Priority Engine error:", err)
    );

    return Response.json({ data: dim }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("DIM create error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
