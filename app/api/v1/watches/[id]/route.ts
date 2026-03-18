import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  sections: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "confirmed"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;

    const watch = await prisma.watch.findUnique({ where: { id } });
    if (!watch || watch.user_id !== userId) {
      return Response.json(
        { error: "Watch not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updateData: Prisma.WatchUpdateInput = { updated_at: new Date() };
    if (parsed.data.sections) {
      updateData.sections = parsed.data.sections as Prisma.InputJsonValue;
    }
    if (parsed.data.status) {
      updateData.status = parsed.data.status;
    }

    const updated = await prisma.watch.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ data: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Watch update error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;

    const watch = await prisma.watch.findUnique({ where: { id } });
    if (!watch || watch.user_id !== userId) {
      return Response.json(
        { error: "Watch not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return Response.json({ data: watch }, { status: 200 });
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
