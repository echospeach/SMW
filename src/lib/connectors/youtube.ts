const OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status";

export const YOUTUBE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

export function youtubeRedirectUri(): string {
  return `${process.env.APP_URL}/api/accounts/youtube/callback`;
}

export function buildYouTubeAuthorizeUrl(state: string): string {
  const url = new URL(OAUTH_BASE);
  url.searchParams.set("client_id", process.env.YOUTUBE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", youtubeRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", YOUTUBE_OAUTH_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  // Google only returns a refresh_token on the *first* consent -- force the
  // consent screen every time so reconnecting after a revoke still works.
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

type GoogleErrorBody = { error?: string; error_description?: string };

async function googleFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) {
    const err = body as GoogleErrorBody;
    throw new Error(err.error_description ?? err.error ?? "Google API request failed");
  }
  return body as T;
}

export type GoogleToken = { access_token: string; refresh_token?: string; expires_in: number };

export async function exchangeCodeForToken(code: string): Promise<GoogleToken> {
  return googleFetch<GoogleToken>(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID ?? "",
      client_secret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
      redirect_uri: youtubeRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleToken> {
  return googleFetch<GoogleToken>(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.YOUTUBE_CLIENT_ID ?? "",
      client_secret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
}

export async function fetchChannelTitle(accessToken: string): Promise<string | null> {
  const res = await googleFetch<{ items?: Array<{ snippet?: { title?: string } }> }>(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.items?.[0]?.snippet?.title ?? null;
}

// YouTube's "multipart" upload type wants a multipart/related body: one JSON
// part (video metadata) followed by one binary part (the video itself),
// joined with a boundary -- built by hand since this isn't a regular form
// upload fetch() can construct automatically.
export async function uploadVideo(
  accessToken: string,
  videoBuffer: Buffer,
  title: string,
  description: string,
): Promise<string> {
  const boundary = "smw_youtube_upload_boundary";
  const metadata = JSON.stringify({
    snippet: { title, description },
    status: { privacyStatus: "public" },
  });

  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`,
    "utf-8",
  );
  const closing = Buffer.from(`\r\n--${boundary}--`, "utf-8");
  const body = Buffer.concat([preamble, videoBuffer, closing]);

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body: new Uint8Array(body),
  });
  const responseBody = await res.json();
  if (!res.ok) {
    const err = responseBody as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "YouTube video upload failed");
  }
  return responseBody.id as string;
}
