import type { TimeRange } from "@/features/project/playback-settings";

export type CutSource = "beat" | "filler" | "silence" | "word";

export interface ClipCut extends TimeRange {
  source: CutSource;
}

/** Replaces every cut made by one tool, leaving other tools' cuts untouched. */
export function replaceCuts(cuts: ClipCut[], source: CutSource, ranges: TimeRange[]): ClipCut[] {
  return [...cuts.filter((cut) => cut.source !== source), ...ranges.map((range) => ({ endSeconds: range.endSeconds, source, startSeconds: range.startSeconds }))];
}

export function countCuts(cuts: ClipCut[], source: CutSource): number {
  return cuts.filter((cut) => cut.source === source).length;
}

export function getCutSeconds(cuts: ClipCut[], source: CutSource): number {
  return cuts.filter((cut) => cut.source === source).reduce((total, cut) => total + cut.endSeconds - cut.startSeconds, 0);
}

/** Cuts a word out of the video, or restores it when it was already cut. */
export function toggleWordCut(cuts: ClipCut[], word: TimeRange): ClipCut[] {
  const matches = (cut: ClipCut) => (cut.source === "word" || cut.source === "filler") && cut.startSeconds === word.startSeconds && cut.endSeconds === word.endSeconds;
  if (cuts.some(matches)) return cuts.filter((cut) => !matches(cut));
  return [...cuts, { endSeconds: word.endSeconds, source: "word", startSeconds: word.startSeconds }];
}
