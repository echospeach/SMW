import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken, fetchMe } from "@/lib/connectors/x";
import { PlatformId } from "@/generated/prisma/enums";

const STATE_COOKIE = "x_oauth_state";
const VERIFIER_COOKIE = "x_oauth_verifier";

function redirectToAccounts(status: string) {
  const url = new URL("/accounts", process.env.APP_URL);
  url.searchParams.set("x", status);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(VERIFIER_COOKIE);
  return response;
}

export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", process.env.APP_URL));

  const { searchParams } = req.nextUrl;

  if (searchParams.get("error")) {
    return redirectToAccounts("denied");
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;
  const verifier = req.cookies.get(VERIFIER_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return redirectToAccounts("invalid_state");
  }

  try {
    const token = await exchangeCodeForToken(code, verifier);
    const me = await fetchMe(token.access_token);

    await prisma.socialConnection.upsert({
      where: { userId_platformId: { userId, platformId: PlatformId.X } },
      update: {
        connected: true,
        handle: `@${me.username}`,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        externalId: me.id,
        connectedAt: new Date(),
      },
      create: {
        userId,
        platformId: PlatformId.X,
        connected: true,
        handle: `@${me.username}`,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        externalId: me.id,
        connectedAt: new Date(),
      },
    });

    return redirectToAccounts("connected");
  } catch (err) {
    console.error("X OAuth callback failed:", err);
    return redirectToAccounts("error");
  }
}
