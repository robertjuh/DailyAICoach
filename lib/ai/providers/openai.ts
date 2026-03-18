import OpenAI from "openai";
import type { AIProvider, ChatMessage, ChatOptions } from "./base";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(model = "gpt-4o") {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = model;
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ReadableStream | string> {
    const params = {
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
      stream: options?.stream ?? false,
    };

    if (params.stream) {
      // TODO: Round 2 — implement streaming response
      const stream = await this.client.chat.completions.create({
        ...params,
        stream: true,
      });

      return new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        },
      });
    }

    // TODO: Round 2 — replace with actual OpenAI call
    const response = await this.client.chat.completions.create({
      ...params,
      stream: false,
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
