import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { buildContext } from "@/lib/ai/context-builder";
import { getRelevantMemories } from "@/lib/ai/memory-service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    // Verify the pipeline works end-to-end
    const context = await buildContext(userId);
    const memories = await getRelevantMemories(userId);

    // Log for debugging (remove in production)
    console.log("Chat context length:", context.length);
    console.log("Relevant memories:", memories.length);

    // TODO: Round 2 — replace with OpenAI stream call
    // 1. Build system prompt with buildSystemPrompt(context, adminPrompt)
    // 2. Get or create today's conversation
    // 3. Add user message to conversation
    // 4. Call OpenAI with full message history
    // 5. Stream response back
    // 6. Save assistant message
    // 7. Extract and save memories from response

    return NextResponse.json(
      {
        data: {
          message:
            "The AI coach is almost ready. You're doing great — keep going!",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
