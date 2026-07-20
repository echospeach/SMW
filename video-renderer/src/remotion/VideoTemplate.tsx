import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadDisplayFont } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadMonoFont } from "@remotion/google-fonts/JetBrainsMono";
import { C } from "./theme";
import type { EnrichedBeat } from "./types";

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

// The same hero image is reused across every beat, so each beat gets a
// different slow pan/zoom ("Ken Burns effect") to keep the video feeling
// alive instead of static. Scale never drops to 1.0 so panning never reveals
// the image's edge -- the overscan margin (8-18%) comfortably covers the
// small percentage pans below.
const KEN_BURNS_PRESETS = [
  { fromScale: 1.08, toScale: 1.18, fromX: 0, toX: -3, fromY: 0, toY: -2 },
  { fromScale: 1.18, toScale: 1.08, fromX: -3, toX: 3, fromY: -1, toY: 1 },
  { fromScale: 1.08, toScale: 1.16, fromX: 2, toX: 0, fromY: -2, toY: 2 },
  { fromScale: 1.16, toScale: 1.08, fromX: 0, toX: -2, fromY: 2, toY: -2 },
];

function BeatSlide({ label, text, imageUrl, audioUrl, beatIndex }: EnrichedBeat & { beatIndex: number }) {
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

  const preset = KEN_BURNS_PRESETS[beatIndex % KEN_BURNS_PRESETS.length];
  const panProgress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(panProgress, [0, 1], [preset.fromScale, preset.toScale]);
  const panX = interpolate(panProgress, [0, 1], [preset.fromX, preset.toX]);
  const panY = interpolate(panProgress, [0, 1], [preset.fromY, preset.toY]);

  return (
    <AbsoluteFill>
      {imageUrl && (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Img
            src={imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${scale}) translate(${panX}%, ${panY}%)`,
              transformOrigin: "center center",
            }}
          />
        </AbsoluteFill>
      )}
      {/* Scrim over the photo so the overlaid caption stays readable */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${C.ink}80 0%, ${C.ink}B3 55%, ${C.ink}E6 100%)`,
        }}
      />
      {audioUrl && <Audio src={audioUrl} />}
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
              textShadow: "0 2px 16px rgba(0,0,0,0.6)",
            }}
          >
            {text}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
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

export function VideoTemplate({ beats }: { beats: EnrichedBeat[] }) {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {beats.map((beat, i) => {
        const from = cursor;
        cursor += beat.durationInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={beat.durationInFrames} layout="none">
            <BeatSlide {...beat} beatIndex={i} />
          </Sequence>
        );
      })}
      <ProgressBar />
    </AbsoluteFill>
  );
}
