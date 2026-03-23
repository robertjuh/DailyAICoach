import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { analyzeDim } from "@/lib/ai/priority-engine";
import { z } from "zod";

const analyzeSchema = z.object({
  dim_id: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const dim = await prisma.dim.findUnique({
      where: { id: parsed.data.dim_id },
    });

    if (!dim || dim.user_id !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await analyzeDim(dim.id, userId);

    const updated = await prisma.dim.findUnique({
      where: { id: dim.id },
      include: { related_goal: { select: { id: true, title: true } } },
    });

    return Response.json({ data: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("DIM analyze error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
