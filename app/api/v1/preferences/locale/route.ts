import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";

const localeSchema = z.object({
  locale: z.enum(["en", "nl"]),
});

const COOKIE_NAME = "locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const parsed = localeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const { locale } = parsed.data;

  try {
    const { userId } = await requireAuth(request);
    await prisma.user.update({
      where: { id: userId },
      data: { locale },
    });
  } catch (error) {
    if (!(error instanceof AuthError)) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
    // Unauthenticated visitor: cookie-only persistence is fine.
  }

  const response = NextResponse.json({ data: { locale } }, { status: 200 });
  response.cookies.set({
    name: COOKIE_NAME,
    value: locale,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}
