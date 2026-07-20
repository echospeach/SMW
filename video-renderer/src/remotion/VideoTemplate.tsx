import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadDisplayFont } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadMonoFont } from "@remotion/google-fonts/JetBrainsMono";
import { C } from "./theme";
import type { Beat } from "./parse-script";

const { fontFamily: displayFont } = loadDisplayFont("normal", { weights: ["700", "800"] });
const { fontFamily: monoFont } = loadMonoFont("normal", { weights: ["500"] });

// Tiered by character count (tuned against Bricolage Grotesque Bold at a 1080px
// baseline width, then scaled for other aspect ratios) so longer beats shrink
// enough to stay within a handful of lines instead of overflowing the frame.
const SIZE_TIERS: [maxChars: number, size: number][] = [
  [30, 72],
  [60, 56],
  [100, 44],
  [140, 36],
  [180, 30],
];
const SMALLEST_TIER_SIZE = 26;

function fontSizeFor(text: string, width: number): number {
  const tier = SIZE_TIERS.find(([maxChars]) => text.length <= maxChars);
  const baseSize = tier ? tier[1] : SMALLEST_TIER_SIZE;
  return Math.round(baseSize * (width / 1080));
}

const TRANSITION_FRAMES = 15;

function BeatSlide({ label, text }: { label: string; text: string }) {
  const frame = useCurrentFrame();
  const { width, durationInFrames, fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES });
  const exitStart = durationInFrames - TRANSITION_FRAMES;
  const exitOpacity =
    frame > exitStart
      ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: "clamp" })
      : 1;

  const opacity = Math.min(entrance, exitOpacity);
  const translateY = interpolate(entrance, [0, 1], [24, 0]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "8%" }}>
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          textAlign: "center",
          maxWidth: "88%",
        }}
      >
        {label && (
          <div
            style={{
              fontFamily: monoFont,
              fontWeight: 500,
              fontSize: width / 32,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.amber,
              marginBottom: "1.4em",
            }}
          >
            {label}
          </div>
        )}
        <div
          style={{
            fontFamily: displayFont,
            fontWeight: 800,
            fontSize: fontSizeFor(text, width),
            lineHeight: 1.15,
            color: C.paper,
            letterSpacing: "-0.01em",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function AmbientGlow() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 0.75 + 0.25 * Math.sin((frame / fps) * 1.1);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 42%, ${C.amber}${Math.round(pulse * 22)
          .toString(16)
          .padStart(2, "0")} 0%, transparent 55%)`,
      }}
    />
  );
}

function ProgressBar() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: "8%",
        right: "8%",
        bottom: "6%",
        height: 4,
        borderRadius: 2,
        background: C.line,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: C.amber,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

export function VideoTemplate({ beats }: { beats: Beat[] }) {
  let cursor = 0;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${C.raised}, ${C.ink})`,
      }}
    >
      <AmbientGlow />
      {beats.map((beat, i) => {
        const from = cursor;
        cursor += beat.durationInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={beat.durationInFrames} layout="none">
            <BeatSlide label={beat.label} text={beat.text} />
          </Sequence>
        );
      })}
      <ProgressBar />
    </AbsoluteFill>
  );
}
