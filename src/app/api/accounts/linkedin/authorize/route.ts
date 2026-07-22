import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { buildLinkedInAuthorizeUrl } from "@/lib/connectors/linkedin";

const STATE_COOKIE = "li_oauth_state";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", process.env.APP_URL));

  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(buildLinkedInAuthorizeUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
