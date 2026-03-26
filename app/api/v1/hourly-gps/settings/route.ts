import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { updateGpsSettingsSchema } from "@/lib/validators/hourly-gps";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hourly_gps_enabled: true,
        hourly_gps_interval: true,
        hourly_gps_start_time: true,
        hourly_gps_end_time: true,
      },
    });

    return NextResponse.json({ data: user }, { status: 200 });
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

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = updateGpsSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: {
        hourly_gps_enabled: true,
        hourly_gps_interval: true,
        hourly_gps_start_time: true,
        hourly_gps_end_time: true,
      },
    });

    return NextResponse.json({ data: user }, { status: 200 });
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
