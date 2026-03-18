import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { buildContext } from "@/lib/ai/context-builder";
import { buildFirstWatchPrompt } from "@/lib/ai/prompts/first-watch";
import { buildNightWatchPrompt } from "@/lib/ai/prompts/night-watch";
import { prisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import OpenAI from "openai";
import { z } from "zod";

const generateSchema = z.object({
  type: z.enum(["FIRST_WATCH", "NIGHT_WATCH"]),
  userInput: z.string().optional(),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { type, userInput } = parsed.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already exists
    const existing = await prisma.watch.findUnique({
      where: {
        user_id_date_type: { user_id: userId, date: today, type },
      },
    });

    if (existing && existing.status === "confirmed") {
      return Response.json(
        { error: "Watch already confirmed for today", code: "ALREADY_EXISTS" },
        { status: 409 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const context = await buildContext(userId);
    const userName = user?.name ?? "Sailor";

    const dateStr = today.toISOString().split("T")[0];
    let systemPrompt: string;

    if (type === "FIRST_WATCH") {
      // Get prior Night Watch (yesterday)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const priorNightWatch = await prisma.watch.findUnique({
        where: {
          user_id_date_type: {
            user_id: userId,
            date: yesterday,
            type: "NIGHT_WATCH",
          },
        },
      });

      systemPrompt = buildFirstWatchPrompt({
        userName,
        date: dateStr,
        context,
        priorNightWatch: priorNightWatch
          ? {
              sections: priorNightWatch.sections as Record<string, unknown>,
              ai_draft: priorNightWatch.ai_draft,
            }
          : null,
      });
    } else {
      // Get today's First Watch
      const todayFirstWatch = await prisma.watch.findUnique({
        where: {
          user_id_date_type: {
            user_id: userId,
            date: today,
            type: "FIRST_WATCH",
          },
        },
      });

      systemPrompt = buildNightWatchPrompt({
        userName,
        date: dateStr,
        context,
        todayFirstWatch: todayFirstWatch
          ? {
              sections: todayFirstWatch.sections as Record<string, unknown>,
              ai_draft: todayFirstWatch.ai_draft,
            }
          : null,
      });
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userInput
          ? `Here's what I want to share for today: ${userInput}`
          : type === "FIRST_WATCH"
            ? "Generate my First Watch for today."
            : "Generate my Night Watch for today.",
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 2048,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let sections: Prisma.InputJsonValue = {};

    try {
      sections = JSON.parse(content) as Prisma.InputJsonValue;
    } catch {
      sections = {};
    }

    // Upsert the watch (update draft if exists, create if new)
    const watch = existing
      ? await prisma.watch.update({
          where: { id: existing.id },
          data: {
            sections,
            ai_draft: content,
            status: "draft",
            updated_at: new Date(),
          },
        })
      : await prisma.watch.create({
          data: {
            user_id: userId,
            date: today,
            type,
            sections,
            ai_draft: content,
            status: "draft",
            updated_at: new Date(),
          },
        });

    return Response.json({ data: watch }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Watch generate error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
