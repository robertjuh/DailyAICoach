export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ReadableStream | string>;
}
