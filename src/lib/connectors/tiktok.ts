const API_BASE = "https://open.tiktokapis.com/v2";

export const TIKTOK_OAUTH_SCOPES = ["user.info.basic", "video.publish"];

export function tiktokRedirectUri(): string {
  return `${process.env.APP_URL}/api/accounts/tiktok/callback`;
}

export function buildTikTokAuthorizeUrl(state: string): string {
  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY ?? "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", TIKTOK_OAUTH_SCOPES.join(","));
  url.searchParams.set("redirect_uri", tiktokRedirectUri());
  url.searchParams.set("state", state);
  return url.toString();
}

export type TikTokToken = {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_token: string;
  refresh_expires_in: number;
  scope: string;
  token_type: string;
};

type TikTokErrorBody = { error?: { code?: string; message?: string } };

async function tiktokFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json();
  const error = (body as TikTokErrorBody)?.error;
  if (!res.ok || (error && error.code && error.code !== "ok")) {
    throw new Error(error?.message ?? "TikTok API request failed");
  }
  return body as T;
}

export async function exchangeCodeForToken(code: string): Promise<TikTokToken> {
  return tiktokFetch<TikTokToken>(`${API_BASE}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: tiktokRedirectUri(),
    }),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<TikTokToken> {
  return tiktokFetch<TikTokToken>(`${API_BASE}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
}

export async function fetchDisplayName(accessToken: string): Promise<string | null> {
  const res = await tiktokFetch<{ data: { user: { display_name?: string } } }>(
    `${API_BASE}/user/info/?fields=display_name`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data.user.display_name ?? null;
}

type CreatorInfo = { privacy_level_options: string[] };

async function queryCreatorInfo(accessToken: string): Promise<CreatorInfo> {
  const res = await tiktokFetch<{ data: CreatorInfo }>(
    `${API_BASE}/post/publish/creator_info/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
    },
  );
  return res.data;
}

function pickPrivacyLevel(options: string[]): string {
  return options.includes("PUBLIC_TO_EVERYONE") ? "PUBLIC_TO_EVERYONE" : (options[0] ?? "SELF_ONLY");
}

// Uploads the video as raw bytes (FILE_UPLOAD) rather than PULL_FROM_URL --
// the latter requires verifying ownership of the video's hosting domain,
// which we can't do for Vercel Blob's shared storage domain.
export async function publishVideo(
  accessToken: string,
  videoBuffer: Buffer,
  title: string,
): Promise<string> {
  const creatorInfo = await queryCreatorInfo(accessToken);
  const privacyLevel = pickPrivacyLevel(creatorInfo.privacy_level_options);

  const init = await tiktokFetch<{ data: { publish_id: string; upload_url: string } }>(
    `${API_BASE}/post/publish/video/init/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoBuffer.length,
          chunk_size: videoBuffer.length,
          total_chunk_count: 1,
        },
      }),
    },
  );

  const uploadRes = await fetch(init.data.upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBuffer.length),
      "Content-Range": `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
    },
    body: new Uint8Array(videoBuffer),
  });
  if (!uploadRes.ok) {
    throw new Error(`TikTok video upload failed with status ${uploadRes.status}`);
  }

  return init.data.publish_id;
}
