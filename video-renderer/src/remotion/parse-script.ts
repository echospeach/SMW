export type LabeledBeat = {
  label: string;
  text: string;
};

const BEAT_PATTERN = /\[([^\]]+)\]\s*([\s\S]*?)(?=\n?\[[^\]]+\]|$)/g;

export const FPS = 30;

/**
 * Parses the bracketed-beat script format the AI content generator produces
 * (e.g. "[Hook] ...\n[Beat 1] ...\n[CTA] ..."). Duration is no longer derived
 * here -- it comes from each beat's generated narration length instead.
 */
export function parseScriptIntoBeats(script: string): LabeledBeat[] {
  const trimmed = script.trim();
  const matches = [...trimmed.matchAll(BEAT_PATTERN)]
    .map((m) => ({ label: m[1]?.trim() ?? "", text: m[2]?.trim() ?? "" }))
    .filter((b) => b.label && b.text);

  return matches.length > 0 ? matches : [{ label: "", text: trimmed }];
}
