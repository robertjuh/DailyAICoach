import { prisma } from "@/lib/db/client";

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function getUserBySupabaseId(supabaseId: string) {
  return prisma.user.findUnique({
    where: { supabase_id: supabaseId },
  });
}

export async function createUser(data: {
  supabase_id: string;
  email: string;
  name?: string;
}) {
  return prisma.user.create({ data });
}

export async function updateUser(
  userId: string,
  data: {
    name?: string;
    onboarding_done?: boolean;
    timezone?: string;
    notify_enabled?: boolean;
    notify_time?: string | null;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}
