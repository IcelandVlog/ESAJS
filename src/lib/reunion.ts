// How long a reunion stays "live" (card on the home page, code entry, etc.)
// after its start time. Once this much time has passed the reunion is treated
// as finished and disappears from the student-facing pages.
// Change this number to keep it visible for shorter/longer.
export const REUNION_VISIBLE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

export function hasReunionEnded(reunionDate: Date | string | null | undefined, now: number = Date.now()): boolean {
  if (!reunionDate) return false;
  return new Date(reunionDate).getTime() + REUNION_VISIBLE_AFTER_MS < now;
}
