import { describe, expect, it } from "vitest";

import { extractKeptSamples, mixMusic, normalizeLoudness, timeStretch } from "./audio-processing";
import { createBeatCuts, detectBeats } from "./beat-detection";
import { detectSilentRanges } from "./silence-detection";
import { createPlaybackSettings, getExportDurationSeconds } from "@/features/project/playback-settings";

const sampleRate = 8000;
const tone = (seconds: number, amplitude = 0.4) => Float32Array.from({ length: seconds * sampleRate }, (_, index) => Math.sin(index / 3) * amplitude);
const join = (...parts: Float32Array[]) => { const output = new Float32Array(parts.reduce((total, part) => total + part.length, 0)); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; };

describe("detectSilentRanges", () => {
  it("finds a pause between speech and keeps padding around it", () => {
    const ranges = detectSilentRanges(join(tone(2), new Float32Array(2 * sampleRate), tone(2)), sampleRate);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].startSeconds).toBeCloseTo(2.08, 1);
    expect(ranges[0].endSeconds).toBeCloseTo(3.92, 1);
  });

  it("ignores pauses shorter than the chosen sensitivity", () => {
    const samples = join(tone(2), new Float32Array(0.5 * sampleRate), tone(2));
    expect(detectSilentRanges(samples, sampleRate, "gentle")).toEqual([]);
    expect(detectSilentRanges(samples, sampleRate, "tight")).toHaveLength(1);
  });

  it("treats a fully silent recording as having nothing to cut", () => {
    expect(detectSilentRanges(new Float32Array(sampleRate), sampleRate)).toEqual([]);
  });
});

describe("beats", () => {
  const clicks = (bpm: number, seconds: number) => { const samples = new Float32Array(seconds * sampleRate); const period = Math.round((60 / bpm) * sampleRate); for (let start = 0; start < samples.length; start += period) for (let index = 0; index < 200 && start + index < samples.length; index += 1) samples[start + index] = 0.9; return samples; };

  it("detects the tempo of a steady pulse", () => {
    expect(detectBeats(clicks(120, 12), sampleRate)?.bpm).toBeCloseTo(120, -1);
  });

  it("creates cuts that shorten the video without exceeding it", () => {
    const playback = createPlaybackSettings(20);
    const cuts = createBeatCuts(Array.from({ length: 40 }, (_, index) => index * 0.5), 4, playback);
    expect(cuts.length).toBeGreaterThan(1);
    expect(cuts.at(-1)!.endSeconds).toBeLessThanOrEqual(20);
    expect(getExportDurationSeconds(createPlaybackSettings(20, { removedRanges: cuts }))).toBeLessThan(20);
  });
});

describe("audio processing", () => {
  it("joins only kept sections", () => {
    expect(extractKeptSamples(tone(4), sampleRate, [{ startSeconds: 0, endSeconds: 1 }, { startSeconds: 3, endSeconds: 4 }])).toHaveLength(2 * sampleRate);
  });

  it("shortens audio by the playback speed", () => {
    expect(timeStretch(tone(4), 2, sampleRate)).toHaveLength(2 * sampleRate);
    const samples = tone(1);
    expect(timeStretch(samples, 1, sampleRate)).toBe(samples);
  });

  it("raises quiet speech without clipping", () => {
    const channel = tone(2, 0.02);
    normalizeLoudness([channel], sampleRate);
    const peak = channel.reduce((maximum, sample) => Math.max(maximum, Math.abs(sample)), 0);
    expect(peak).toBeGreaterThan(0.05);
    expect(peak).toBeLessThanOrEqual(0.97);
  });

  it("lowers music while the voice is speaking", () => {
    const voice = join(tone(2), new Float32Array(2 * sampleRate));
    const music = Float32Array.from({ length: 4 * sampleRate }, () => 0.5);
    const mixed = mixMusic(voice, music, sampleRate, 1, true, 4 * sampleRate);
    const silentMusic = mixMusic(undefined, music, sampleRate, 1, true, 4 * sampleRate);
    expect(Math.abs(mixed[Math.round(2.8 * sampleRate)])).toBeGreaterThan(0.4);
    expect(silentMusic[sampleRate]).toBeCloseTo(0.5);
  });
});
