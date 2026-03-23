import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const createFilterSchema = z.object({
  name: z.string().min(1).max(100),
  weight: z.number().int().min(1).max(10).optional(),
});

const updateFiltersSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string().min(1).max(100).optional(),
    weight: z.number().int().min(1).max(10).optional(),
    is_active: z.boolean().optional(),
  })
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const filters = await prisma.priorityFilter.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
    });

    return Response.json({ data: filters }, { status: 200 });
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = createFilterSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Limit to 7 filters max
    const count = await prisma.priorityFilter.count({
      where: { user_id: userId },
    });
    if (count >= 7) {
      return Response.json(
        { error: "Maximum 7 priority filters allowed", code: "LIMIT_REACHED" },
        { status: 400 }
      );
    }

    const filter = await prisma.priorityFilter.create({
      data: {
        user_id: userId,
        name: parsed.data.name,
        weight: parsed.data.weight ?? 5,
      },
    });

    return Response.json({ data: filter }, { status: 201 });
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

/** Batch update filters (name, weight, is_active) */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = updateFiltersSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    await Promise.all(
      updates.map(async (u) => {
        const filter = await prisma.priorityFilter.findUnique({
          where: { id: u.id },
        });
        if (!filter || filter.user_id !== userId) return;

        const data: Record<string, unknown> = {};
        if (u.name !== undefined) data.name = u.name;
        if (u.weight !== undefined) data.weight = u.weight;
        if (u.is_active !== undefined) data.is_active = u.is_active;

        await prisma.priorityFilter.update({ where: { id: u.id }, data });
      })
    );

    const filters = await prisma.priorityFilter.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
    });

    return Response.json({ data: filters }, { status: 200 });
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
