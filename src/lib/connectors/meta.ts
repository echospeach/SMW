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
