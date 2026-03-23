import { prisma } from "@/lib/db/client";
import OpenAI from "openai";
import { getOpenAIModel } from "./model-config";
import type { DimRecommendation } from "@prisma/client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeDim(dimId: string, userId: string) {
  const [dim, filters, goals] = await Promise.all([
    prisma.dim.findUnique({ where: { id: dimId } }),
    prisma.priorityFilter.findMany({
      where: { user_id: userId, is_active: true },
    }),
    prisma.goal.findMany({
      where: { user_id: userId, is_active: true },
    }),
  ]);

  if (!dim) return;

  const filterList = filters
    .map((f) => `- ${f.name} (weight: ${f.weight}/10)`)
    .join("\n");

  const goalList = goals.map((g) => `- ${g.title}`).join("\n");

  const prompt = `You are a Priority Engine for a personal productivity system.

Evaluate this DIM (Decision/Idea/Micro-task) against the user's priority filters and goals.

## DIM to Analyze
- Content: "${dim.content}"
- Category: ${dim.category}

## User's Priority Filters
${filterList || "No custom filters set. Use reasonable defaults: Urgency, Alignment with goals, Effort required, Impact."}

## User's Active Goals
${goalList || "No goals set yet."}

## Instructions
1. Score this DIM from 0-100 based on how important/urgent it is, weighted by the user's filters
2. Recommend one action: DO (act on it now), DEFER (schedule for later), DELEGATE (hand off), or DELETE (not worth pursuing)
3. Provide brief reasoning (1-2 sentences)

Return valid JSON:
{
  "priority_score": <number 0-100>,
  "recommendation": "DO" | "DEFER" | "DELEGATE" | "DELETE",
  "reasoning": "<brief explanation>"
}`;

  const response = await openai.chat.completions.create({
    model: getOpenAIModel(),
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 256,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  let result: { priority_score?: number; recommendation?: string; reasoning?: string };

  try {
    result = JSON.parse(content);
  } catch {
    return;
  }

  const validRecs = ["DO", "DEFER", "DELEGATE", "DELETE"] as const;
  const rec = validRecs.includes(result.recommendation as (typeof validRecs)[number])
    ? (result.recommendation as DimRecommendation)
    : null;

  await prisma.dim.update({
    where: { id: dimId },
    data: {
      priority_score: typeof result.priority_score === "number"
        ? Math.min(100, Math.max(0, Math.round(result.priority_score)))
        : null,
      recommendation: rec,
      ai_reasoning: result.reasoning ?? null,
    },
  });
}
