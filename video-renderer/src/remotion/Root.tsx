import React from "react";
import { Composition } from "remotion";
import { VideoTemplate } from "./VideoTemplate";
import { FPS, parseScriptIntoBeats, type Beat } from "./parse-script";

export type SocialVideoProps = {
  script: string;
  ratio: "PORTRAIT" | "SQUARE" | "LANDSCAPE";
};

const RATIO_DIMENSIONS: Record<SocialVideoProps["ratio"], { width: number; height: number }> = {
  PORTRAIT: { width: 1080, height: 1920 },
  SQUARE: { width: 1080, height: 1080 },
  LANDSCAPE: { width: 1920, height: 1080 },
};

function VideoFromScript({ script }: SocialVideoProps) {
  const beats: Beat[] = parseScriptIntoBeats(script);
  return <VideoTemplate beats={beats} />;
}

export function RemotionRoot() {
  return (
    <Composition
      id="SocialVideo"
      component={VideoFromScript}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={150}
      defaultProps={{ script: "[Hook] Loading…", ratio: "PORTRAIT" } as SocialVideoProps}
      calculateMetadata={async ({ props }) => {
        const beats = parseScriptIntoBeats(props.script);
        const durationInFrames = Math.max(
          beats.reduce((sum, b) => sum + b.durationInFrames, 0),
          FPS * 2,
        );
        const { width, height } = RATIO_DIMENSIONS[props.ratio];
        return { durationInFrames, width, height };
      }}
    />
  );
}
