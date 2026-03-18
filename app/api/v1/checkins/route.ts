import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { createCheckinSchema } from "@/lib/validators/checkins";
import { prisma } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = createCheckinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await prisma.checkIn.findUnique({
      where: { user_id_date: { user_id: userId, date: today } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already checked in today", code: "DUPLICATE" },
        { status: 409 }
      );
    }

    const checkin = await prisma.checkIn.create({
      data: {
        user_id: userId,
        date: today,
        energy: parsed.data.energy,
        focus: parsed.data.focus,
        mood: parsed.data.mood,
        note: parsed.data.note,
      },
    });

    return NextResponse.json({ data: checkin }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
