import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAuth, AuthError } from "@/lib/auth/middleware";
import { onboardingSchema } from "@/lib/validators/onboarding";
import { prisma } from "@/lib/db/client";
import { saveMemory } from "@/lib/ai/memory-service";

export async function POST(request: NextRequest) {
  try {
    const { supabaseUser } = await requireSupabaseAuth(request);

    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, goals, routine_items } = parsed.data;

    // Create user record (or update if exists)
    const user = await prisma.user.upsert({
      where: { supabase_id: supabaseUser.id },
      update: {
        name,
        onboarding_done: true,
      },
      create: {
        supabase_id: supabaseUser.id,
        email: supabaseUser.email!,
        name,
        onboarding_done: true,
      },
    });

    // Create goals
    await prisma.goal.createMany({
      data: goals
        .filter((g) => g.trim().length > 0)
        .map((title) => ({
          user_id: user.id,
          title,
          is_active: true,
        })),
    });

    // Create routine with items
    const routine = await prisma.routine.create({
      data: {
        user_id: user.id,
        name: "Morning Routine",
        type: "MORNING",
        items: {
          create: routine_items.map((item, index) => ({
            name: item.name,
            duration_minutes: item.duration_minutes,
            sort_order: index,
          })),
        },
      },
      include: { items: true },
    });

    // Create memory entries for each goal
    for (const goal of goals.filter((g) => g.trim().length > 0)) {
      await saveMemory(
        user.id,
        "GOAL",
        `User wants to: ${goal}`,
        "onboarding"
      );
    }

    return NextResponse.json(
      { data: { user, routine } },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
