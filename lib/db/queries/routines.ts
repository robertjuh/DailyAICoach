import { prisma } from "@/lib/db/client";
import type { RoutineType } from "@prisma/client";

export async function getRoutinesByUser(userId: string) {
  return prisma.routine.findMany({
    where: { user_id: userId },
    include: { items: { orderBy: { sort_order: "asc" } } },
    orderBy: { sort_order: "asc" },
  });
}

export async function getActiveRoutine(userId: string, type?: RoutineType) {
  return prisma.routine.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      ...(type ? { type } : {}),
    },
    include: { items: { where: { is_active: true }, orderBy: { sort_order: "asc" } } },
  });
}

export async function getRoutineById(routineId: string, userId: string) {
  return prisma.routine.findFirst({
    where: { id: routineId, user_id: userId },
    include: { items: { orderBy: { sort_order: "asc" } } },
  });
}

export async function createRoutine(data: {
  user_id: string;
  name: string;
  type: RoutineType;
  items: { name: string; duration_minutes: number; sort_order: number }[];
}) {
  return prisma.routine.create({
    data: {
      user_id: data.user_id,
      name: data.name,
      type: data.type,
      items: {
        create: data.items,
      },
    },
    include: { items: true },
  });
}

export async function updateRoutine(
  routineId: string,
  userId: string,
  data: {
    name?: string;
    is_active?: boolean;
    items?: { name: string; duration_minutes: number; sort_order: number }[];
  }
) {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, user_id: userId },
  });
  if (!routine) return null;

  if (data.items) {
    // Delete existing items and recreate
    await prisma.routineItem.deleteMany({ where: { routine_id: routineId } });
    return prisma.routine.update({
      where: { id: routineId },
      data: {
        name: data.name,
        is_active: data.is_active,
        items: { create: data.items },
      },
      include: { items: true },
    });
  }

  return prisma.routine.update({
    where: { id: routineId },
    data: { name: data.name, is_active: data.is_active },
    include: { items: true },
  });
}
