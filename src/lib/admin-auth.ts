import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Fully separate from Auth.js's session-token cookie by design -- the admin
// portal has its own login and its own signed cookie, not a next-auth
// session. Uses Node's built-in crypto (HMAC) rather than a JWT library,
// matching this codebase's existing preference (password-reset tokens
// already use raw crypto.randomBytes/createHash).
const ADMIN_SESSION_COOKIE = "smw_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

type AdminTokenPayload = { sub: string; exp: number };

function sign(payloadB64: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "")
    .update(payloadB64)
    .digest("base64url");
}

function signAdminToken(adminUserId: string): string {
  const payload: AdminTokenPayload = { sub: adminUserId, exp: Date.now() + SESSION_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

function verifyAdminToken(token: string): { sub: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const payloadB64 = parts[0];
  const signature = parts[1];
  if (!payloadB64 || !signature) return null;

  const expectedSignature = sign(payloadB64);
  if (signature.length !== expectedSignature.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

  let payload: AdminTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
  if (payload.exp < Date.now()) return null;

  return { sub: payload.sub };
}

// Only callable from a Server Action or Route Handler.
export async function setAdminSessionCookie(adminUserId: string): Promise<void> {
  const token = signAdminToken(adminUserId);
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

// Only callable from a Server Action or Route Handler.
export async function clearAdminSessionCookie(): Promise<void> {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}

// Safe to call from Server Components (read-only).
export async function getAdminSession(): Promise<{ sub: string } | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return token ? verifyAdminToken(token) : null;
}

export async function requireAdminId(): Promise<string | null> {
  const session = await getAdminSession();
  return session?.sub ?? null;
}
