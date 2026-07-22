import { createHash, randomBytes } from "crypto";

const API_BASE = "https://api.x.com";

export const X_OAUTH_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

export function xRedirectUri(): string {
  return `${process.env.APP_URL}/api/accounts/x/callback`;
}

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generatePkceVerifier(): string {
  return base64url(randomBytes(32));
}

export function pkceChallengeFromVerifier(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

export function buildXAuthorizeUrl(state: string, codeChallenge: string): string {
  const url = new URL(`${API_BASE}/2/oauth2/authorize`);
  url.searchParams.set("client_id", process.env.X_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", xRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", X_OAUTH_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

type XErrorBody = { error?: string; error_description?: string; detail?: string };

async function xFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) {
    const err = body as XErrorBody;
    throw new Error(err.error_description ?? err.detail ?? err.error ?? "X API request failed");
  }
  return body as T;
}

export type XToken = { access_token: string; refresh_token?: string; expires_in: number };

// X's OAuth 2.0 client authentication for a confidential client is HTTP
// Basic auth with client_id:client_secret, not a body parameter.
function basicAuthHeader(): string {
  return `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64")}`;
}

export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<XToken> {
  return xFetch<XToken>(`${API_BASE}/2/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.X_CLIENT_ID ?? "",
      redirect_uri: xRedirectUri(),
      code_verifier: codeVerifier,
    }),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<XToken> {
  return xFetch<XToken>(`${API_BASE}/2/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.X_CLIENT_ID ?? "",
    }),
  });
}

export async function fetchMe(accessToken: string): Promise<{ id: string; username: string }> {
  const res = await xFetch<{ data: { id: string; username: string } }>(`${API_BASE}/2/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

// v1: text-only. Attaching images requires a separate media-upload endpoint
// (api.x.com/2/media/upload) and a media_id reference -- not built yet.
export async function postTweet(accessToken: string, text: string): Promise<string> {
  const res = await xFetch<{ data: { id: string } }>(`${API_BASE}/2/tweets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text }),
  });
  return res.data.id;
}
