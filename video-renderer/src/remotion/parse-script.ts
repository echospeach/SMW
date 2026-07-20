export type Beat = {
  label: string;
  text: string;
  durationInFrames: number;
};

const BEAT_PATTERN = /\[([^\]]+)\]\s*([\s\S]*?)(?=\n?\[[^\]]+\]|$)/g;
const FPS = 30;
const MIN_BEAT_FRAMES = 75; // 2.5s
const MAX_BEAT_FRAMES = 150; // 5s
const FRAMES_PER_WORD = 9;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Parses the bracketed-beat script format the AI content generator produces
 * (e.g. "[Hook] ...\n[Beat 1] ...\n[CTA] ..."), assigning each beat an
 * on-screen duration proportional to its word count.
 */
export function parseScriptIntoBeats(script: string): Beat[] {
  const trimmed = script.trim();
  const matches = [...trimmed.matchAll(BEAT_PATTERN)]
    .map((m) => ({ label: m[1]?.trim() ?? "", text: m[2]?.trim() ?? "" }))
    .filter((b) => b.label && b.text);

  const beats = matches.length > 0 ? matches : [{ label: "", text: trimmed }];

  return beats.map((b) => {
    const wordCount = b.text.split(/\s+/).filter(Boolean).length;
    const durationInFrames = clamp(wordCount * FRAMES_PER_WORD, MIN_BEAT_FRAMES, MAX_BEAT_FRAMES);
    return { ...b, durationInFrames };
  });
}

export { FPS };
