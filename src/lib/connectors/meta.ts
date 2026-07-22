const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export const FACEBOOK_OAUTH_SCOPES = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];

export function facebookRedirectUri(): string {
  return `${process.env.APP_URL}/api/accounts/facebook/callback`;
}

export function buildFacebookAuthorizeUrl(state: string): string {
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  url.searchParams.set("redirect_uri", facebookRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("scope", FACEBOOK_OAUTH_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  return url.toString();
}

type GraphErrorBody = { error?: { message?: string } };

async function graphFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) {
    const message = (body as GraphErrorBody)?.error?.message ?? "Facebook API request failed";
    throw new Error(message);
  }
  return body as T;
}

export async function exchangeCodeForUserToken(code: string): Promise<string> {
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  url.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
  url.searchParams.set("redirect_uri", facebookRedirectUri());
  url.searchParams.set("code", code);
  const { access_token } = await graphFetch<{ access_token: string }>(url.toString());
  return access_token;
}

export async function exchangeForLongLivedUserToken(shortLivedToken: string): Promise<string> {
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  url.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
  url.searchParams.set("fb_exchange_token", shortLivedToken);
  const { access_token } = await graphFetch<{ access_token: string }>(url.toString());
  return access_token;
}

export type FacebookPage = { id: string; name: string; access_token: string };

export async function fetchManagedPages(userAccessToken: string): Promise<FacebookPage[]> {
  const url = new URL(`${GRAPH_BASE}/me/accounts`);
  url.searchParams.set("access_token", userAccessToken);
  const { data } = await graphFetch<{ data: FacebookPage[] }>(url.toString());
  return data;
}

export async function publishToPage(
  pageId: string,
  pageAccessToken: string,
  text: string,
): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: pageAccessToken }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error((body as GraphErrorBody)?.error?.message ?? "Facebook publish failed");
  }
  return body.id as string;
}

export type MetaPostInsights = {
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
};

// Page-post insights (reach) plus the basic engagement fields available
// directly on the post node. Metric names verified against the Graph API
// v21.0 reference at implementation time -- re-check if this ever 400s with
// an "Invalid metric" error, since Meta deprecates/renames these periodically.
export async function fetchPostInsights(
  postId: string,
  pageAccessToken: string,
): Promise<MetaPostInsights | null> {
  const url = new URL(`${GRAPH_BASE}/${postId}`);
  url.searchParams.set("fields", "likes.summary(true),comments.summary(true),shares");
  url.searchParams.set("access_token", pageAccessToken);

  const insightsUrl = new URL(`${GRAPH_BASE}/${postId}/insights`);
  insightsUrl.searchParams.set("metric", "post_impressions");
  insightsUrl.searchParams.set("access_token", pageAccessToken);

  const [engagement, impressionsResult] = await Promise.all([
    graphFetch<{
      likes?: { summary?: { total_count?: number } };
      comments?: { summary?: { total_count?: number } };
      shares?: { count?: number };
    }>(url.toString()),
    graphFetch<{ data?: Array<{ values?: Array<{ value?: number }> }> }>(
      insightsUrl.toString(),
    ).catch(() => null),
  ]);

  return {
    impressions: impressionsResult?.data?.[0]?.values?.[0]?.value,
    likes: engagement.likes?.summary?.total_count,
    comments: engagement.comments?.summary?.total_count,
    shares: engagement.shares?.count,
  };
}

export async function publishVideoToPage(
  pageId: string,
  pageAccessToken: string,
  videoUrl: string,
  description: string,
): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${pageId}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_url: videoUrl, description, access_token: pageAccessToken }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error((body as GraphErrorBody)?.error?.message ?? "Facebook video publish failed");
  }
  return body.id as string;
}

// Instagram publishing reuses this same Meta app/OAuth flow (Facebook
// Login) rather than a separate app -- it just needs additional scopes and
// its own redirect URI, since the Page a user picks during Facebook OAuth
// may not be the one they want to publish to Instagram through.
export const INSTAGRAM_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_content_publish",
];

export function instagramRedirectUri(): string {
  return `${process.env.APP_URL}/api/accounts/instagram/callback`;
}

export function buildInstagramAuthorizeUrl(state: string): string {
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  url.searchParams.set("redirect_uri", instagramRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("scope", INSTAGRAM_OAUTH_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  return url.toString();
}

// The Instagram Professional Account must be linked to the Facebook Page
// the user manages -- this looks up that linked account's ID, which is what
// publishing/insights endpoints address rather than the Page ID itself.
export async function fetchInstagramBusinessAccountId(
  pageId: string,
  pageAccessToken: string,
): Promise<string | null> {
  const url = new URL(`${GRAPH_BASE}/${pageId}`);
  url.searchParams.set("fields", "instagram_business_account");
  url.searchParams.set("access_token", pageAccessToken);
  const body = await graphFetch<{ instagram_business_account?: { id: string } }>(url.toString());
  return body.instagram_business_account?.id ?? null;
}

// Publishing to Instagram is two steps: create a media container from a
// publicly reachable image URL, then publish that container. The container
// can take a moment to finish processing, so this polls its status field
// before publishing rather than publishing blind.
export async function publishImageToInstagram(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
): Promise<string> {
  const createUrl = new URL(`${GRAPH_BASE}/${igUserId}/media`);
  const createRes = await fetch(createUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const createBody = await createRes.json();
  if (!createRes.ok) {
    throw new Error((createBody as GraphErrorBody)?.error?.message ?? "Instagram container creation failed");
  }
  const containerId = createBody.id as string;

  for (let attempt = 0; attempt < 10; attempt++) {
    const statusUrl = new URL(`${GRAPH_BASE}/${containerId}`);
    statusUrl.searchParams.set("fields", "status_code");
    statusUrl.searchParams.set("access_token", accessToken);
    const { status_code } = await graphFetch<{ status_code?: string }>(statusUrl.toString());
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR") throw new Error("Instagram media container failed to process");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const publishUrl = new URL(`${GRAPH_BASE}/${igUserId}/media_publish`);
  const publishRes = await fetch(publishUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
  });
  const publishBody = await publishRes.json();
  if (!publishRes.ok) {
    throw new Error((publishBody as GraphErrorBody)?.error?.message ?? "Instagram publish failed");
  }
  return publishBody.id as string;
}

export type InstagramMediaInsights = {
  impressions?: number;
  likes?: number;
  comments?: number;
};

export async function fetchInstagramMediaInsights(
  mediaId: string,
  accessToken: string,
): Promise<InstagramMediaInsights | null> {
  const url = new URL(`${GRAPH_BASE}/${mediaId}`);
  url.searchParams.set("fields", "like_count,comments_count");
  url.searchParams.set("access_token", accessToken);

  const insightsUrl = new URL(`${GRAPH_BASE}/${mediaId}/insights`);
  insightsUrl.searchParams.set("metric", "impressions");
  insightsUrl.searchParams.set("access_token", accessToken);

  const [basic, impressionsResult] = await Promise.all([
    graphFetch<{ like_count?: number; comments_count?: number }>(url.toString()),
    graphFetch<{ data?: Array<{ values?: Array<{ value?: number }> }> }>(
      insightsUrl.toString(),
    ).catch(() => null),
  ]);

  return {
    impressions: impressionsResult?.data?.[0]?.values?.[0]?.value,
    likes: basic.like_count,
    comments: basic.comments_count,
  };
}
