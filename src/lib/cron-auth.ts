import { timingSafeEqual } from "crypto";

// Constant-time comparison so a slow, distributed guessing attempt can't use
// response-time differences to recover CRON_SECRET one byte at a time.
export function isValidCronSecret(provided: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!provided || !expected) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
