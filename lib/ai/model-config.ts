/**
 * Central OpenAI model configuration.
 *
 * Set OPENAI_MODEL in .env.local to switch models globally.
 * Valid values: "gpt-4o", "gpt-5.4-nano", "gpt-5.4-mini"
 */
export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || "gpt-5.4-mini";
}
