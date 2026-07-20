export type Ratio = "PORTRAIT" | "SQUARE" | "LANDSCAPE";

export type EnrichedBeat = {
  label: string;
  text: string;
  imageUrl: string;
  audioUrl: string;
  durationInFrames: number;
};
