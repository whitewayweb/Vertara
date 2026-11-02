import { describe, expect, it } from "vitest";

import { createCaptionLines, createSubtitleFile, getActiveCaption, isFillerWord, isWordCut, type TranscriptWord } from "./captions";
import { createPlaybackSettings } from "@/features/project/playback-settings";

const words: TranscriptWord[] = ["Hello", "um", "everyone.", "Welcome", "back"].map((text, index) => ({ endSeconds: index + 0.9, id: `w${index}`, startSeconds: index, text }));

describe("captions", () => {
  it("recognises fillers regardless of case or punctuation", () => {
    expect(isFillerWord("Um,")).toBe(true);
    expect(isFillerWord("umbrella")).toBe(false);
  });

  it("breaks lines at sentence ends and hides cut words", () => {
    const playback = createPlaybackSettings(10, { removedRanges: [{ startSeconds: 1, endSeconds: 1.9 }] });
    expect(isWordCut(words[1], playback)).toBe(true);
    const lines = createCaptionLines(words, playback);
    expect(lines.map((line) => line.words.map((word) => word.text).join(" "))).toEqual(["Hello everyone.", "Welcome back"]);
  });

  it("keeps a word whose stretched timing runs into a removed pause", () => {
    const stretched = { endSeconds: 4, id: "w", startSeconds: 2, text: "channel." };
    expect(isWordCut(stretched, createPlaybackSettings(10, { removedRanges: [{ startSeconds: 2.5, endSeconds: 6 }] }))).toBe(false);
    expect(isWordCut(stretched, createPlaybackSettings(10, { removedRanges: [{ startSeconds: 2, endSeconds: 4 }] }))).toBe(true);
  });

  it("finds the word being spoken", () => {
    const lines = createCaptionLines(words, createPlaybackSettings(10));
    expect(getActiveCaption(lines, 3.5)?.activeWordId).toBe("w3");
    expect(getActiveCaption(lines, 9)).toBeUndefined();
  });

  it("writes subtitle timing against the finished video", () => {
    const playback = createPlaybackSettings(10, { removedRanges: [{ startSeconds: 1, endSeconds: 1.9 }] });
    const srt = createSubtitleFile(words, playback, "srt");
    expect(srt).toContain("1\n00:00:00,000 --> ");
    expect(srt).toContain("Welcome back");
    expect(srt).not.toContain("um");
    expect(createSubtitleFile(words, playback, "vtt").startsWith("WEBVTT")).toBe(true);
  });
});
