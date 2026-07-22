const API_BASE = "https://api.linkedin.com";
// LinkedIn's versioned REST API requires this header in YYYYMM format --
// bump periodically; LinkedIn supports the last ~12 months of versions.
const LINKEDIN_API_VERSION = "202601";

export const LINKEDIN_OAUTH_SCOPES = ["openid", "profile", "w_member_social"];

export function linkedinRedirectUri(): string {
  return `${process.env.APP_URL}/api/accounts/linkedin/callback`;
}

export function buildLinkedInAuthorizeUrl(state: string): string {
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", process.env.LINKEDIN_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", linkedinRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("scope", LINKEDIN_OAUTH_SCOPES.join(" "));
  return url.toString();
}

type LinkedInErrorBody = { error?: string; error_description?: string; message?: string };

async function linkedinFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body as LinkedInErrorBody;
    throw new Error(err.error_description ?? err.message ?? err.error ?? "LinkedIn API request failed");
  }
  return body as T;
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; expires_in: number }> {
  return linkedinFetch(`https://www.linkedin.com/oauth/v2/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: linkedinRedirectUri(),
      client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
      client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
    }),
  });
}

export async function fetchMemberId(accessToken: string): Promise<string> {
  const res = await linkedinFetch<{ sub: string }>(`${API_BASE}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.sub;
}

// Posts on behalf of the authenticated member (not an organization page --
// that needs an org URN + w_organization_social scope, a separate flow).
export async function createPost(accessToken: string, personId: string, text: string): Promise<string> {
  const res = await fetch(`${API_BASE}/rest/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": LINKEDIN_API_VERSION,
    },
    body: JSON.stringify({
      author: `urn:li:person:${personId}`,
      commentary: text,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as LinkedInErrorBody).message ?? "LinkedIn post creation failed");
  }
  const postId = res.headers.get("x-restli-id");
  if (!postId) throw new Error("LinkedIn did not return a post ID");
  return postId;
}
