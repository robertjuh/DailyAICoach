/**
 * Get the start of "today" in a given timezone as a UTC Date.
 *
 * Problem: `new Date().setHours(0,0,0,0)` uses the server's timezone (UTC on Vercel).
 * If a user in Amsterdam (UTC+1) opens the app at 00:30 local time,
 * the server thinks it's still "yesterday" (23:30 UTC).
 *
 * This function computes the user's local date and returns UTC midnight for that date,
 * so database queries match the user's actual day.
 */
export function getUserToday(timezone: string): Date {
  const now = new Date();
  // toLocaleDateString with 'en-CA' gives YYYY-MM-DD format in the target timezone
  const dateStr = now.toLocaleDateString("en-CA", { timeZone: timezone });
  return new Date(dateStr + "T00:00:00.000Z");
}
