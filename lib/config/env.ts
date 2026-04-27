export function isPromptDebugEnabled(): boolean {
  return process.env.DEBUG_PROMPTS === "true";
}

