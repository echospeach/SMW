import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken, fetchChannelTitle } from "@/lib/connectors/youtube";
import { PlatformId } from "@/generated/prisma/enums";

const STATE_COOKIE = "yt_oauth_state";

function redirectToAccounts(status: string) {
  const url = new URL("/accounts", process.env.APP_URL);
  url.searchParams.set("youtube", status);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
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
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToAccounts("invalid_state");
  }

  try {
    const token = await exchangeCodeForToken(code);
    if (!token.refresh_token) {
      return redirectToAccounts("no_refresh_token");
    }
    const channelTitle = await fetchChannelTitle(token.access_token);

    await prisma.socialConnection.upsert({
      where: { userId_platformId: { userId, platformId: PlatformId.YOUTUBE } },
      update: {
        connected: true,
        handle: channelTitle,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        connectedAt: new Date(),
      },
      create: {
        userId,
        platformId: PlatformId.YOUTUBE,
        connected: true,
        handle: channelTitle,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        connectedAt: new Date(),
      },
    });

    return redirectToAccounts("connected");
  } catch (err) {
    console.error("YouTube OAuth callback failed:", err);
    return redirectToAccounts("error");
  }
}
