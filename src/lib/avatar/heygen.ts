// SMW never handles consent videos, reference photos, or avatar training --
// the user creates their own Digital Twin avatar directly on heygen.com
// (HeyGen's own consent flow, their own liability handling), then pastes the
// resulting avatar_id into SMW Settings. This client only calls the
// standard, non-enterprise-gated video-generation endpoint from an existing
// avatar_id -- confirmed reachable with a normal API key (unlike HeyGen's
// consent-recording API, which is enterprise-whitelisted only).
//
// Exact request/response field names below are based on current research,
// not an official reference page fetch -- re-verify against
// developers.heygen.com once HEYGEN_API_KEY is available, before relying on
// this in production.
const API_BASE = "https://api.heygen.com";

type HeygenErrorBody = { error?: { message?: string } | string; message?: string };

async function heygenFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "X-Api-Key": process.env.HEYGEN_API_KEY ?? "",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body as HeygenErrorBody;
    const message =
      typeof err.error === "string" ? err.error : (err.error?.message ?? err.message ?? "HeyGen API request failed");
    throw new Error(message);
  }
  return body as T;
}

export async function generateAvatarVideo(
  avatarId: string,
  voiceId: string,
  script: string,
): Promise<string> {
  const body = await heygenFetch<{ video_id?: string; data?: { video_id: string } }>("/v3/videos", {
    method: "POST",
    body: JSON.stringify({
      avatar_id: avatarId,
      voice_id: voiceId,
      script,
      aspect_ratio: "9:16",
    }),
  });
  const videoId = body.video_id ?? body.data?.video_id;
  if (!videoId) throw new Error("HeyGen did not return a video ID");
  return videoId;
}

export type AvatarVideoStatus = {
  status: "pending" | "processing" | "completed" | "failed" | string;
  videoUrl?: string;
  error?: string;
};

export async function checkAvatarVideoStatus(videoId: string): Promise<AvatarVideoStatus> {
  const body = await heygenFetch<{
    status?: string;
    video_url?: string;
    error?: string;
    data?: { status?: string; video_url?: string; error?: string };
  }>(`/v3/videos/${videoId}`);
  const data = body.data ?? body;
  return {
    status: data.status ?? "pending",
    videoUrl: data.video_url,
    error: data.error,
  };
}
