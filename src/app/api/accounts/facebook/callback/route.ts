import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForUserToken,
  exchangeForLongLivedUserToken,
  fetchManagedPages,
} from "@/lib/connectors/meta";
import { PlatformId } from "@/generated/prisma/enums";

const STATE_COOKIE = "fb_oauth_state";

function redirectToAccounts(status: string) {
  const url = new URL("/accounts", process.env.APP_URL);
  url.searchParams.set("facebook", status);
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
    const shortLivedToken = await exchangeCodeForUserToken(code);
    const longLivedToken = await exchangeForLongLivedUserToken(shortLivedToken);
    const pages = await fetchManagedPages(longLivedToken);

    // MVP: use the first Page returned. If you manage multiple Pages, switch
    // which one is connected by disconnecting and reconnecting for now.
    const page = pages[0];
    if (!page) {
      return redirectToAccounts("no_pages");
    }

    await prisma.socialConnection.upsert({
      where: { userId_platformId: { userId, platformId: PlatformId.FACEBOOK } },
      update: {
        connected: true,
        handle: page.name,
        accessToken: page.access_token,
        externalId: page.id,
        connectedAt: new Date(),
      },
      create: {
        userId,
        platformId: PlatformId.FACEBOOK,
        connected: true,
        handle: page.name,
        accessToken: page.access_token,
        externalId: page.id,
        connectedAt: new Date(),
      },
    });

    return redirectToAccounts("connected");
  } catch (err) {
    console.error("Facebook OAuth callback failed:", err);
    return redirectToAccounts("error");
  }
}
