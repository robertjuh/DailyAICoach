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

    const {
      name,
      timezone,
      locale,
      goals,
      work_description,
      default_day_type,
      first_watch_time,
      night_watch_time,
      movement_preference,
      notify_enabled,
    } = parsed.data;

    // Create or update user record
    const user = await prisma.user.upsert({
      where: { supabase_id: supabaseUser.id },
      update: {
        name,
        timezone,
        locale,
        first_watch_time,
        night_watch_time,
        notify_enabled,
        onboarding_done: true,
      },
      create: {
        supabase_id: supabaseUser.id,
        email: supabaseUser.email!,
        name,
        timezone,
        locale,
        first_watch_time,
        night_watch_time,
        notify_enabled,
        onboarding_done: true,
      },
    });

    // Create goals
    const filledGoals = goals.filter((g) => g.trim().length > 0);
    if (filledGoals.length > 0) {
      await prisma.goal.createMany({
        data: filledGoals.map((title) => ({
          user_id: user.id,
          title,
          is_active: true,
        })),
      });
    }

    // Create GOAL memories
    for (const goal of filledGoals) {
      await saveMemory(user.id, "GOAL", `User wants to: ${goal}`, "onboarding");
    }

    // Create PREFERENCE memories for watch-relevant context
    if (work_description?.trim()) {
      await saveMemory(
        user.id,
        "PREFERENCE",
        `Work context: ${work_description}`,
        "onboarding"
      );
    }

    if (default_day_type) {
      await saveMemory(
        user.id,
        "PREFERENCE",
        `Default day type: ${default_day_type}`,
        "onboarding"
      );
    }

    if (movement_preference?.trim()) {
      await saveMemory(
        user.id,
        "PREFERENCE",
        `Movement preference: ${movement_preference}`,
        "onboarding"
      );
    }

    // Seed default Priority Engine filters
    const defaultFilters = [
      { name: "Urgency", weight: 8 },
      { name: "Alignment", weight: 7 },
      { name: "Effort", weight: 5 },
      { name: "Impact", weight: 6 },
    ];

    await prisma.priorityFilter.createMany({
      data: defaultFilters.map((f) => ({
        user_id: user.id,
        name: f.name,
        weight: f.weight,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(
      { data: { user } },
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
