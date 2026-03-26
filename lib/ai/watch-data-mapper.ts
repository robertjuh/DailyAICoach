/**
 * Watch Data Mapper
 *
 * Extracts structured fields from watch sections and formats them
 * as explicit, labeled prompt sections for the AI to use.
 * This replaces the naive ai_draft/JSON.stringify approach with
 * clear field-level mappings between Night Watch and First Watch.
 */

interface WakeEffect {
  carry_forward_tasks?: string[];
  energy_state?: string;
  open_loops?: string[];
}

interface NightWatchSections {
  wake_effect?: WakeEffect;
  emotional_weather?: string;
  friction_and_drift?: {
    attention_wandered?: string;
    time_leaked?: string;
    patterns?: string;
  };
  open_dims?: Array<{ item: string; recommendation: string }>;
  theme?: string;
  wins?: string[];
}

interface MissionFocus {
  day_type?: string;
  primary_focus?: string;
}

interface DriftWatch {
  risks?: string[];
  course_correction?: string;
}

interface FirstWatchSections {
  mission_focus?: MissionFocus;
  top_priorities?: string[];
  drift_watch?: DriftWatch;
  operating_posture?: string;
  gratitude?: string[];
}

export interface HourlyCheckinData {
  time: Date;
  working_on: string;
  drift_note?: string | null;
  win?: string | null;
  energy?: number | null;
  next_plan?: string | null;
}

/**
 * Formats Night Watch sections into explicit, labeled fields
 * for use in the First Watch prompt. This ensures the AI gets
 * clear field-level data for wake_inheritance mapping.
 */
export function formatNightWatchForFirstWatch(
  sections: Record<string, unknown>
): string {
  const nw = sections as NightWatchSections;
  const lines: string[] = [];

  // Wake Effect → Wake Inheritance mapping
  const we: WakeEffect | undefined = nw.wake_effect;
  if (we) {
    lines.push(`ENERGY STATE: ${we.energy_state ?? "Not recorded"}`);

    if (we.carry_forward_tasks && we.carry_forward_tasks.length > 0) {
      lines.push(`CARRY-FORWARD TASKS:\n${we.carry_forward_tasks.map((t) => `  - ${t}`).join("\n")}`);
    } else {
      lines.push("CARRY-FORWARD TASKS: None");
    }

    if (we.open_loops && we.open_loops.length > 0) {
      lines.push(`OPEN LOOPS:\n${we.open_loops.map((l) => `  - ${l}`).join("\n")}`);
    } else {
      lines.push("OPEN LOOPS: None");
    }
  }

  // Emotional residue from emotional_weather
  lines.push(`EMOTIONAL RESIDUE: ${nw.emotional_weather ?? "Not recorded"}`);

  // Drift patterns from friction_and_drift
  if (nw.friction_and_drift?.patterns) {
    lines.push(`DRIFT PATTERNS FROM YESTERDAY: ${nw.friction_and_drift.patterns}`);
  }

  // Yesterday's wins for context
  if (nw.wins && nw.wins.length > 0) {
    lines.push(`YESTERDAY'S WINS:\n${nw.wins.map((w) => `  - ${w}`).join("\n")}`);
  }

  // Open DIMs carried forward
  if (nw.open_dims && nw.open_dims.length > 0) {
    lines.push(
      `OPEN DIMS FROM NIGHT WATCH:\n${nw.open_dims.map((d) => `  - ${d.item} → ${d.recommendation}`).join("\n")}`
    );
  }

  return lines.join("\n\n");
}

/**
 * Formats First Watch sections into explicit, labeled fields
 * for use in the Night Watch prompt. This gives the AI a clear
 * "planned vs actual" comparison framework.
 */
export function formatFirstWatchForNightWatch(
  sections: Record<string, unknown>
): string {
  const fw = sections as FirstWatchSections;
  const lines: string[] = [];

  // Mission focus
  if (fw.mission_focus) {
    lines.push(`PLANNED DAY TYPE: ${fw.mission_focus.day_type ?? "Not set"}`);
    lines.push(`PRIMARY FOCUS: ${fw.mission_focus.primary_focus ?? "Not set"}`);
  }

  // Top priorities
  if (fw.top_priorities && fw.top_priorities.length > 0) {
    lines.push(
      `PLANNED PRIORITIES:\n${fw.top_priorities.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}`
    );
  }

  // Drift watch
  if (fw.drift_watch?.risks && fw.drift_watch.risks.length > 0) {
    lines.push(
      `ANTICIPATED DRIFT RISKS:\n${fw.drift_watch.risks.map((r) => `  - ${r}`).join("\n")}`
    );
  }
  if (fw.drift_watch?.course_correction) {
    lines.push(`PLANNED COURSE CORRECTION: ${fw.drift_watch.course_correction}`);
  }

  // Operating posture
  if (fw.operating_posture) {
    lines.push(`OPERATING POSTURE: ${fw.operating_posture}`);
  }

  return lines.join("\n\n");
}

/**
 * Formats Hourly GPS check-in data into a timeline for watch prompts.
 * Returns null if no check-ins exist.
 */
export function formatHourlyGpsForWatch(
  checkins: HourlyCheckinData[]
): string | null {
  if (!checkins || checkins.length === 0) return null;

  const lines: string[] = [];

  // Timeline
  for (const c of checkins) {
    const time = new Date(c.time).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    let entry = `- ${time} | Working on: ${c.working_on}`;
    if (c.energy) entry += ` | Energy: ${c.energy}/5`;
    if (c.drift_note) entry += ` | Drift: ${c.drift_note}`;
    if (c.win) entry += ` | Win: ${c.win}`;
    if (c.next_plan) entry += ` | Next: ${c.next_plan}`;
    lines.push(entry);
  }

  // Patterns summary
  const patterns: string[] = [];

  const energies = checkins.filter((c) => c.energy != null).map((c) => c.energy!);
  if (energies.length > 0) {
    const avg = (energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1);
    patterns.push(`Average energy: ${avg}/5`);
  }

  const driftCount = checkins.filter((c) => c.drift_note).length;
  if (driftCount > 0) {
    patterns.push(`${driftCount} drift note${driftCount > 1 ? "s" : ""} recorded`);
  }

  const winCount = checkins.filter((c) => c.win).length;
  if (winCount > 0) {
    patterns.push(`${winCount} win${winCount > 1 ? "s" : ""} captured`);
  }

  if (patterns.length > 0) {
    lines.push(`\nPatterns: ${patterns.join(", ")}`);
  }

  return lines.join("\n");
}
