import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import {
  saveMemory,
  updateGoalMemory,
  deleteGoalMemory,
} from "@/lib/ai/memory-service";

const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing || existing.user_id !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { title, is_active } = parsed.data;

    // Memory sync
    if (title && title !== existing.title) {
      await updateGoalMemory(userId, existing.title, title);
    }

    if (is_active !== undefined && is_active !== existing.is_active) {
      if (!is_active) {
        // Deactivating — remove from AI context
        await deleteGoalMemory(userId, title ?? existing.title);
      } else {
        // Reactivating — re-add to AI context
        await saveMemory(
          userId,
          "GOAL",
          `User wants to: ${title ?? existing.title}`,
          "goals"
        );
      }
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: parsed.data,
    });

    return Response.json({ data: goal }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Goal update error:", error);
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

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing || existing.user_id !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await deleteGoalMemory(userId, existing.title);
    await prisma.goal.delete({ where: { id } });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Goal delete error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
