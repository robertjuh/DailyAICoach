import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ChatMessage, ChatOptions } from "./base";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(model = "claude-sonnet-4-6") {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = model;
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ReadableStream | string> {
    // Separate system message from the rest
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const params = {
      model: this.model,
      max_tokens: options?.maxTokens ?? 1024,
      ...(systemMessage ? { system: systemMessage.content } : {}),
      messages: conversationMessages,
    };

    if (options?.stream) {
      // TODO: Round 2 — implement streaming response
      const stream = await this.client.messages.stream({
        ...params,
      });

      return new ReadableStream({
        async start(controller) {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                new TextEncoder().encode(event.delta.text)
              );
            }
          }
          controller.close();
        },
      });
    }

    // TODO: Round 2 — replace with actual Anthropic call
    const response = await this.client.messages.create(params);

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock ? textBlock.text : "";
  }
}
