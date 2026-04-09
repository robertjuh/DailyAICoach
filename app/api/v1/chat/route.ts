import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { buildContext } from "@/lib/ai/context-builder";
import { buildSystemPrompt } from "@/lib/ai/prompts/coach-system";
import { extractAndSaveMemories, extractAndSaveDims } from "@/lib/ai/memory-service";
import { prisma } from "@/lib/db/client";
import OpenAI from "openai";
import { getOpenAIModel } from "@/lib/ai/model-config";
import { getUserToday } from "@/lib/date-utils";
import { z } from "zod";

const chatInputSchema = z.object({
  message: z.string().min(1).max(5000),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = chatInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Message is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const userMessage = parsed.data.message;

    // 1. Fetch user + build context and system prompt
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, locale: true },
    });
    const context = await buildContext(userId);
    const adminPrompt = await prisma.adminPrompt
      .findUnique({ where: { key: "coach_system" } })
      .then((p) => p?.content ?? "");
    const systemPrompt = buildSystemPrompt(context, adminPrompt, user?.locale ?? "en");

    // 2. Get or create today's conversation
    const today = getUserToday(user?.timezone ?? "UTC");

    let conversation = await prisma.conversation.findUnique({
      where: { user_id_date: { user_id: userId, date: today } },
      include: { messages: { orderBy: { created_at: "asc" } } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user_id: userId, date: today },
        include: { messages: { orderBy: { created_at: "asc" } } },
      });
    }

    // 3. Save user message
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        role: "USER",
        content: userMessage,
      },
    });

    // 4. Build messages array for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversation.messages.map((m) => ({
        role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })),
      { role: "user" as const, content: userMessage },
    ];

    // 5. Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages,
      max_completion_tokens: 1024,
      temperature: 0.7,
      stream: true,
    });

    // 6. Create a streaming response
    let fullResponse = "";
    const conversationId = conversation.id;
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Send done event
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          // 7. Save assistant message (after stream completes)
          await prisma.message.create({
            data: {
              conversation_id: conversationId,
              role: "ASSISTANT",
              content: fullResponse,
            },
          });

          // 8. Extract and save memories + DIMs from response
          await Promise.all([
            extractAndSaveMemories(userId, fullResponse),
            extractAndSaveDims(userId, fullResponse),
          ]);
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Chat error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
