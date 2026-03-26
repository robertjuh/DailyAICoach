import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { batchLogSchema } from "@/lib/validators/logs";
import { createLogsInBatch } from "@/lib/db/queries/logs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = batchLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const items = parsed.data.items.map((item) => {
      const date = new Date(item.date + "T00:00:00.000Z");
      return { routine_item_id: item.routine_item_id, date };
    });

    const logs = await createLogsInBatch(userId, items);
    return NextResponse.json({ data: logs }, { status: 200 });
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
