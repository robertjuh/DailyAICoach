import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { buildContext } from "@/lib/ai/context-builder";
import { prisma } from "@/lib/db/client";
import OpenAI from "openai";
import { getOpenAIModel } from "@/lib/ai/model-config";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const context = await buildContext(userId);

    // Get user's active routine for context
    const routine = await prisma.routine.findFirst({
      where: { user_id: userId, is_active: true },
      include: { items: { where: { is_active: true } } },
    });

    const response = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: "system",
          content: `You are a daily routine coach. Based on the user's context, generate exactly 3 short, actionable suggestions. Each should be 1 sentence. Return as JSON array of strings.

${context}`,
        },
        {
          role: "user",
          content: routine
            ? "Give me 3 quick suggestions to improve my routine today."
            : "Give me 3 suggestions to get started with a morning routine.",
        },
      ],
      max_completion_tokens: 300,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let suggestions: string[] = [];

    try {
      const parsed = JSON.parse(content);
      suggestions = Array.isArray(parsed.suggestions)
        ? parsed.suggestions.slice(0, 3)
        : Array.isArray(parsed)
          ? parsed.slice(0, 3)
          : [];
    } catch {
      suggestions = [];
    }

    return Response.json({ data: suggestions }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Suggestions error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
