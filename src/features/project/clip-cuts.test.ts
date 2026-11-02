import { describe, expect, it } from "vitest";

import { getCutSeconds, replaceCuts, toggleWordCut } from "./clip-cuts";
import { createPlaybackSettings, getExportDurationSeconds, getKeptRanges, getNextPlayableSeconds, getOutputElapsedSeconds, getSourceSeconds } from "./playback-settings";

describe("cuts", () => {
  const removedRanges = [{ startSeconds: 2, endSeconds: 4 }, { startSeconds: 3, endSeconds: 5 }, { startSeconds: 8, endSeconds: 9 }];

  it("merges overlapping cuts and keeps the rest", () => {
    const playback = createPlaybackSettings(10, { removedRanges });
    expect(playback.removedRanges).toEqual([{ startSeconds: 2, endSeconds: 5 }, { startSeconds: 8, endSeconds: 9 }]);
    expect(getKeptRanges(playback)).toEqual([{ startSeconds: 0, endSeconds: 2 }, { startSeconds: 5, endSeconds: 8 }, { startSeconds: 9, endSeconds: 10 }]);
    expect(getExportDurationSeconds(playback)).toBe(6);
  });

  it("converts between source and finished-video time, including speed", () => {
    const playback = createPlaybackSettings(10, { removedRanges, speed: 2 });
    expect(getOutputElapsedSeconds(6, playback)).toBe(1.5);
    expect(getSourceSeconds(1.5, playback)).toBe(6);
  });

  it("skips cuts and loops back at the end", () => {
    const playback = createPlaybackSettings(10, { removedRanges });
    expect(getNextPlayableSeconds(3, playback)).toBe(5);
    expect(getNextPlayableSeconds(1, playback)).toBe(1);
    expect(getNextPlayableSeconds(10, playback)).toBe(0);
  });

  it("never lets cuts remove the whole video", () => {
    expect(createPlaybackSettings(10, { removedRanges: [{ startSeconds: 0, endSeconds: 10 }] }).removedRanges).toEqual([]);
  });

  it("replaces only one tool's cuts and restores toggled words", () => {
    const cuts = replaceCuts([{ endSeconds: 2, source: "word", startSeconds: 1 }], "silence", [{ startSeconds: 4, endSeconds: 6 }]);
    expect(cuts).toHaveLength(2);
    expect(getCutSeconds(cuts, "silence")).toBe(2);
    expect(toggleWordCut(cuts, { startSeconds: 1, endSeconds: 2 })).toHaveLength(1);
    expect(toggleWordCut(cuts, { startSeconds: 7, endSeconds: 8 })).toHaveLength(3);
  });
});
