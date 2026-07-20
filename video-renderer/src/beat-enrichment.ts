import { parseBuffer } from "music-metadata";
import { put } from "@vercel/blob";
import { parseScriptIntoBeats, FPS } from "./remotion/parse-script";
import { generateHeroImage, generateBeatAudio } from "./openai";
import type { EnrichedBeat, Ratio } from "./remotion/types";

// Extra silence after narration ends before cutting to the next beat, so
// the last word isn't clipped and the pacing doesn't feel rushed.
const AUDIO_PADDING_SECONDS = 0.5;
const FALLBACK_AUDIO_SECONDS = 3;

export async function enrichScript(
  jobId: string,
  script: string,
  ratio: Ratio,
): Promise<EnrichedBeat[]> {
  const rawBeats = parseScriptIntoBeats(script);

  // One hero image for the whole video, themed on the full script -- reused
  // across every beat (see VideoTemplate.tsx for the per-beat pan/zoom).
  const heroPrompt = rawBeats.map((b) => b.text).join(" ");
  const heroImageBuffer = await generateHeroImage(heroPrompt, ratio);
  const heroImageBlob = await put(`videos/${jobId}/hero.png`, heroImageBuffer, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
  });

  return Promise.all(
    rawBeats.map(async (beat, i) => {
      const audioBuffer = await generateBeatAudio(beat.text);

      const metadata = await parseBuffer(new Uint8Array(audioBuffer), "audio/mpeg");
      const audioSeconds = metadata.format.duration ?? FALLBACK_AUDIO_SECONDS;
      const durationInFrames = Math.ceil((audioSeconds + AUDIO_PADDING_SECONDS) * FPS);

      const audioBlob = await put(`videos/${jobId}/beat-${i}.mp3`, audioBuffer, {
        access: "public",
        contentType: "audio/mpeg",
        addRandomSuffix: false,
      });

      return {
        label: beat.label,
        text: beat.text,
        imageUrl: heroImageBlob.url,
        audioUrl: audioBlob.url,
        durationInFrames,
      };
    }),
  );
}
