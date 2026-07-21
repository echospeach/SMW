import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken, fetchDisplayName } from "@/lib/connectors/tiktok";
import { PlatformId } from "@/generated/prisma/enums";

const STATE_COOKIE = "tiktok_oauth_state";

function redirectToAccounts(status: string) {
  const url = new URL("/accounts", process.env.APP_URL);
  url.searchParams.set("tiktok", status);
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
    const displayName = await fetchDisplayName(token.access_token).catch(() => null);

    const data = {
      connected: true,
      handle: displayName ?? `TikTok user ${token.open_id.slice(0, 8)}`,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      externalId: token.open_id,
      connectedAt: new Date(),
    };

    await prisma.socialConnection.upsert({
      where: { userId_platformId: { userId, platformId: PlatformId.TIKTOK } },
      update: data,
      create: { userId, platformId: PlatformId.TIKTOK, ...data },
    });

    return redirectToAccounts("connected");
  } catch (err) {
    console.error("TikTok OAuth callback failed:", err);
    return redirectToAccounts("error");
  }
}
