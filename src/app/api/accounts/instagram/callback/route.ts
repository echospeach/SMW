import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForUserToken,
  exchangeForLongLivedUserToken,
  fetchInstagramBusinessAccountId,
  fetchManagedPages,
} from "@/lib/connectors/meta";
import { PlatformId } from "@/generated/prisma/enums";

const STATE_COOKIE = "ig_oauth_state";

function redirectToAccounts(status: string) {
  const url = new URL("/accounts", process.env.APP_URL);
  url.searchParams.set("instagram", status);
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

    // MVP: use the first Page with an Instagram Business Account linked.
    let igUserId: string | null = null;
    let page = null;
    for (const candidate of pages) {
      const linked = await fetchInstagramBusinessAccountId(candidate.id, candidate.access_token);
      if (linked) {
        igUserId = linked;
        page = candidate;
        break;
      }
    }
    if (!igUserId || !page) {
      return redirectToAccounts("no_linked_account");
    }

    await prisma.socialConnection.upsert({
      where: { userId_platformId: { userId, platformId: PlatformId.INSTAGRAM } },
      update: {
        connected: true,
        handle: page.name,
        accessToken: page.access_token,
        externalId: igUserId,
        connectedAt: new Date(),
      },
      create: {
        userId,
        platformId: PlatformId.INSTAGRAM,
        connected: true,
        handle: page.name,
        accessToken: page.access_token,
        externalId: igUserId,
        connectedAt: new Date(),
      },
    });

    return redirectToAccounts("connected");
  } catch (err) {
    console.error("Instagram OAuth callback failed:", err);
    return redirectToAccounts("error");
  }
}
