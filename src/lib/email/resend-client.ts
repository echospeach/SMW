import { Resend } from "resend";

// Constructed lazily: Resend's constructor throws synchronously on a
// missing/empty API key, which would otherwise crash the build (and any
// route that imports this module) before RESEND_API_KEY is configured.
let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}
