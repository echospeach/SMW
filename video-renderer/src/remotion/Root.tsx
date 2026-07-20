import React from "react";
import { Composition } from "remotion";
import { VideoTemplate } from "./VideoTemplate";
import { FPS } from "./parse-script";
import type { EnrichedBeat, Ratio } from "./types";

export type SocialVideoProps = {
  beats: EnrichedBeat[];
  ratio: Ratio;
};

const RATIO_DIMENSIONS: Record<Ratio, { width: number; height: number }> = {
  PORTRAIT: { width: 1080, height: 1920 },
  SQUARE: { width: 1080, height: 1080 },
  LANDSCAPE: { width: 1920, height: 1080 },
};

function VideoFromBeats({ beats }: SocialVideoProps) {
  return <VideoTemplate beats={beats} />;
}

const DEFAULT_BEATS: EnrichedBeat[] = [
  { label: "Hook", text: "Loading…", imageUrl: "", audioUrl: "", durationInFrames: 90 },
];

export function RemotionRoot() {
  return (
    <Composition
      id="SocialVideo"
      component={VideoFromBeats}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={150}
      defaultProps={{ beats: DEFAULT_BEATS, ratio: "PORTRAIT" } as SocialVideoProps}
      calculateMetadata={async ({ props }) => {
        const durationInFrames = Math.max(
          props.beats.reduce((sum, b) => sum + b.durationInFrames, 0),
          FPS * 2,
        );
        const { width, height } = RATIO_DIMENSIONS[props.ratio];
        return { durationInFrames, width, height };
      }}
    />
  );
}
