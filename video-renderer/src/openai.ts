import OpenAI, { RateLimitError } from "openai";
import type { Ratio } from "./remotion/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const IMAGE_SIZE_BY_RATIO: Record<Ratio, "1024x1536" | "1024x1024" | "1536x1024"> = {
  PORTRAIT: "1024x1536",
  SQUARE: "1024x1024",
  LANDSCAPE: "1536x1024",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The account's current gpt-image-1.5 tier caps out at a handful of requests
// per minute, and one video already fires one image call per beat -- easy to
// exceed alone, let alone with a second render happening at the same time.
// Retry with backoff instead of failing the whole render on a 429.
async function withRateLimitRetry<T>(fn: () => Promise<T>, retries = 5): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof RateLimitError) || attempt >= retries) throw err;
      const delayMs = 4000 * 2 ** attempt;
      console.warn(`Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${retries})`);
      await sleep(delayMs);
    }
  }
}

// Serializes image-generation *starts* process-wide (across every beat and
// every concurrent render) so we don't exceed the account's ~5-request/min
// cap regardless of how many beats a script has or how many renders overlap.
// Calls still run concurrently once started -- only the start times are
// spaced out -- so this barely affects wall-clock time in the common case
// where generation itself takes longer than the spacing interval.
const IMAGE_CALL_MIN_INTERVAL_MS = 13_000;
let lastImageCallStartedAt = 0;
let imageCallQueue: Promise<void> = Promise.resolve();

function scheduleImageCall<T>(fn: () => Promise<T>): Promise<T> {
  const turn = imageCallQueue.then(async () => {
    const wait = Math.max(0, lastImageCallStartedAt + IMAGE_CALL_MIN_INTERVAL_MS - Date.now());
    if (wait > 0) await sleep(wait);
    lastImageCallStartedAt = Date.now();
  });
  imageCallQueue = turn;
  return turn.then(fn);
}

export async function generateBeatImage(beatText: string, ratio: Ratio): Promise<Buffer> {
  const response = await scheduleImageCall(() =>
    withRateLimitRetry(() =>
      client.images.generate({
        model: "gpt-image-1.5",
        prompt: `Cinematic, photorealistic scene illustrating: "${beatText}". Professional product/lifestyle photography, natural lighting, shallow depth of field. No text, no words, no logos, no watermarks anywhere in the image.`,
        size: IMAGE_SIZE_BY_RATIO[ratio],
        quality: "low",
        n: 1,
      }),
    ),
  );
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned no data");
  return Buffer.from(b64, "base64");
}

export async function generateBeatAudio(beatText: string): Promise<Buffer> {
  const response = await withRateLimitRetry(() =>
    client.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: beatText,
      response_format: "mp3",
    }),
  );
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
