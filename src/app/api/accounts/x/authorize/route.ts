import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { buildXAuthorizeUrl, generatePkceVerifier, pkceChallengeFromVerifier } from "@/lib/connectors/x";

const STATE_COOKIE = "x_oauth_state";
const VERIFIER_COOKIE = "x_oauth_verifier";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", process.env.APP_URL));

  const state = randomBytes(24).toString("hex");
  const verifier = generatePkceVerifier();
  const challenge = pkceChallengeFromVerifier(verifier);

  const response = NextResponse.redirect(buildXAuthorizeUrl(state, challenge));
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  response.cookies.set(STATE_COOKIE, state, cookieOpts);
  response.cookies.set(VERIFIER_COOKIE, verifier, cookieOpts);
  return response;
}
