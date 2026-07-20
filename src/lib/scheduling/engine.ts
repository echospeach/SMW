const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * True if `now` is within [slot, slot + toleranceMinutes] on the same calendar day as `now`.
 * The tolerance window absorbs an imprecise/late cron trigger (e.g. GitHub Actions cron
 * running a few minutes behind schedule) without needing exact-minute alignment.
 */
export function isSlotDue(slot: string, now: Date, toleranceMinutes = 10): boolean {
  const match = TIME_SLOT_PATTERN.exec(slot);
  if (!match) return false;

  const slotDate = new Date(now);
  slotDate.setHours(Number(match[1]), Number(match[2]), 0, 0);

  const diffMs = now.getTime() - slotDate.getTime();
  return diffMs >= 0 && diffMs <= toleranceMinutes * 60 * 1000;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
