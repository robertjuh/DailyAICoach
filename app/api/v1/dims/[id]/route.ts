import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const updateDimSchema = z.object({
  content: z.string().min(1).max(1000).optional(),
  category: z.enum(["DECISION", "IDEA", "MICRO_TASK"]).optional(),
  status: z.enum(["OPEN", "COMPLETED", "DEFERRED", "DELEGATED", "DELETED"]).optional(),
  related_goal_id: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;

    const dim = await prisma.dim.findUnique({
      where: { id },
      include: { related_goal: { select: { id: true, title: true } } },
    });

    if (!dim || dim.user_id !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ data: dim }, { status: 200 });
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;

    const existing = await prisma.dim.findUnique({ where: { id } });
    if (!existing || existing.user_id !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateDimSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...parsed.data };

    // Set completed_at when status changes to COMPLETED
    if (parsed.data.status === "COMPLETED" && existing.status !== "COMPLETED") {
      data.completed_at = new Date();
    }
    // Clear completed_at if reopened
    if (parsed.data.status === "OPEN" && existing.status === "COMPLETED") {
      data.completed_at = null;
    }

    const dim = await prisma.dim.update({ where: { id }, data });
    return Response.json({ data: dim }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("DIM update error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;

    const existing = await prisma.dim.findUnique({ where: { id } });
    if (!existing || existing.user_id !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.dim.delete({ where: { id } });
    return Response.json({ success: true }, { status: 200 });
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
