export function getLocaleInstruction(locale: string): string {
  if (locale === "nl") {
    // TODO: Roberto: dit moet in de style die in de originele do staat
    return "\n\n## Language\nYou MUST respond entirely in Dutch (Nederlands). Every single word must be Dutch — never mix in English words or phrases. Do not change in communication style. Keep JSON keys in English but generate all user-facing values in Dutch.";
  }
  return ""; // English is default, no extra instruction needed
}
