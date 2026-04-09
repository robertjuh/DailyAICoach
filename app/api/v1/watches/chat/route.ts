import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { buildContext } from "@/lib/ai/context-builder";
import { prisma } from "@/lib/db/client";
import { extractAndSaveDims } from "@/lib/ai/memory-service";
import OpenAI from "openai";
import { getOpenAIModel } from "@/lib/ai/model-config";
import { getUserToday } from "@/lib/date-utils";
import { z } from "zod";
import {
  formatNightWatchForFirstWatch,
  formatFirstWatchForNightWatch,
  formatHourlyGpsForWatch,
} from "@/lib/ai/watch-data-mapper";
import { getLocaleInstruction } from "@/lib/ai/locale-instruction";

const chatSchema = z.object({
  watchType: z.enum(["FIRST_WATCH", "NIGHT_WATCH"]),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildWatchChatPrompt(
  watchType: string,
  userName: string,
  context: string,
  dimsSummary: string | null,
  priorWatchData: string | null,
  hourlyGpsData: string | null,
  locale: string = "en"
): string {
  const isFirstWatch = watchType === "FIRST_WATCH";

  return `You are ${userName}'s ${isFirstWatch ? "morning orientation" : "evening reflection"} assistant for the Daily Coach app.

## Your Role
${
  isFirstWatch
    ? `- Orient ${userName} to the day ahead through conversation
- Carry forward context from Night Watch
- Surface priorities calmly and clearly
- Help them move forward without urgency, pressure, or overwhelm`
    : `- Help ${userName} close the day clearly and honestly through conversation
- Capture what actually happened
- Surface meaningful progress and friction
- Notice patterns, drift, and momentum
- Prepare a clean Wake Effect for tomorrow's First Watch`
}

## Conversation Style
- Be warm, calm, and human — like a trusted crew member who knows the sailor
- Ask one question at a time, don't overwhelm
- ${isFirstWatch ? "Start by asking how they're feeling this morning" : "Start by asking how the day went"}
- After 2-4 exchanges, you'll have enough context. Let the user know they can generate their ${isFirstWatch ? "First Watch" : "Night Watch"} when ready
- Keep responses short (2-3 sentences + a question)

## Operating Principles
${
  isFirstWatch
    ? `- Use invitational phrasing: "Today may be a good day for..." or "Consider..."
- Every morning should feel alive and specific, even when data is sparse`
    : `- Night Watch is integration, not evaluation. Observe the seas, don't judge the sailor.
- Be factual, calm, and supportive
- Favor clarity over completeness`
}

${priorWatchData ? `## ${isFirstWatch ? "Prior Night Watch — Structured Data" : "Today's First Watch — Planned Day"}\n${priorWatchData}` : ""}

${hourlyGpsData ? `## ${isFirstWatch ? "Yesterday's" : "Today's"} Hourly GPS Timeline\n${hourlyGpsData}` : ""}

${
  dimsSummary
    ? `## Open DIMs (Decisions, Ideas, Micro-tasks)
These are ${userName}'s currently open DIMs. Naturally weave them into conversation when relevant — ask if they want to act on, defer, or close any. When triaging a DIM, include a tag like [DIM_TRIAGE: <dim_id>: COMPLETED] or [DIM_TRIAGE: <dim_id>: DEFERRED].

${dimsSummary}`
    : ""
}

## DIM Capture
If ${userName} mentions a new idea, decision, or task during the conversation, capture it with a tag:
- [DIM: IDEA: <content>]
- [DIM: DECISION: <content>]
- [DIM: MICRO_TASK: <content>]

Acknowledge the capture naturally: "I've noted that down in your DIM Ledger."

## User Context
${context}${getLocaleInstruction(locale)}`;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const body = await request.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { watchType, messages: chatMessages } = parsed.data;

    // Fetch user first for timezone-aware date computation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const today = getUserToday(user?.timezone ?? "UTC");

    // Fetch context in parallel
    const yesterday = new Date(today.getTime() - 86400000);
    const [context, openDims, priorWatchRaw, hourlyCheckins] = await Promise.all([
      buildContext(userId),
      prisma.dim.findMany({
        where: { user_id: userId, status: { in: ["OPEN", "DEFERRED"] } },
        orderBy: [{ priority_score: "desc" }, { created_at: "desc" }],
      }),
      watchType === "FIRST_WATCH"
        ? prisma.watch.findUnique({
            where: {
              user_id_date_type: {
                user_id: userId,
                date: yesterday,
                type: "NIGHT_WATCH",
              },
            },
          })
        : prisma.watch.findUnique({
            where: {
              user_id_date_type: {
                user_id: userId,
                date: today,
                type: "FIRST_WATCH",
              },
            },
          }),
      prisma.hourlyCheckin?.findMany({
        where: {
          user_id: userId,
          date: watchType === "FIRST_WATCH" ? yesterday : today,
        },
        orderBy: { time: "asc" },
      }).catch(() => []) ?? Promise.resolve([]),
    ]);

    // Format prior watch data using structured mapper instead of raw ai_draft
    const priorWatch = priorWatchRaw
      ? watchType === "FIRST_WATCH"
        ? formatNightWatchForFirstWatch(priorWatchRaw.sections as Record<string, unknown>)
        : formatFirstWatchForNightWatch(priorWatchRaw.sections as Record<string, unknown>)
      : null;

    const gpsData = formatHourlyGpsForWatch(hourlyCheckins);

    const userName = user?.name ?? "Sailor";

    const dimsSummary =
      openDims.length > 0
        ? openDims
            .map((d) => {
              const score =
                d.priority_score !== null ? ` [score: ${d.priority_score}]` : "";
              const rec = d.recommendation ? ` → ${d.recommendation}` : "";
              return `- (id:${d.id}) [${d.category}] ${d.content}${score}${rec}`;
            })
            .join("\n")
        : null;

    const locale = user?.locale ?? "en";
    const systemPrompt = buildWatchChatPrompt(
      watchType,
      userName,
      context,
      dimsSummary,
      priorWatch,
      gpsData,
      locale
    );

    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...chatMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const stream = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: openaiMessages,
      max_completion_tokens: 512,
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = "";
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

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          // Process DIM tags from the response
          await extractAndSaveDims(userId, fullResponse);

          // Process DIM triage tags
          const triageRegex =
            /\[DIM_TRIAGE:\s*(\S+?):\s*(COMPLETED|DEFERRED|DELEGATED|DELETED|OPEN)\]/g;
          let triageMatch: RegExpExecArray | null;
          while (
            (triageMatch = triageRegex.exec(fullResponse)) !== null
          ) {
            const dimId = triageMatch[1];
            const status = triageMatch[2] as
              | "COMPLETED"
              | "DEFERRED"
              | "DELEGATED"
              | "DELETED"
              | "OPEN";
            try {
              const dim = await prisma.dim.findUnique({
                where: { id: dimId },
              });
              if (dim && dim.user_id === userId) {
                await prisma.dim.update({
                  where: { id: dimId },
                  data: {
                    status,
                    completed_at:
                      status === "COMPLETED" ? new Date() : undefined,
                  },
                });
              }
            } catch {
              // Ignore invalid DIM IDs
            }
          }
        } catch (err) {
          console.error("Watch chat stream error:", err);
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
    console.error("Watch chat error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
