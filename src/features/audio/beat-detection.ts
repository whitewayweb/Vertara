import { getKeptRanges, type PlaybackSettings, type TimeRange } from "@/features/project/playback-settings";
import { getRmsEnvelope } from "@/features/audio/silence-detection";

export interface BeatAnalysis {
  beatSeconds: number[];
  bpm: number;
}

const hopSeconds = 0.01;
const minimumBpm = 60;
const maximumBpm = 180;

/** Estimates tempo from the rhythm of volume jumps, then lines a beat grid up with the strongest hits. */
export function detectBeats(samples: Float32Array, sampleRate: number): BeatAnalysis | undefined {
  const hopSize = Math.max(1, Math.round(sampleRate * hopSeconds));
  const envelope = getRmsEnvelope(samples, hopSize);
  const onsets = envelope.map((value, index) => index === 0 ? 0 : Math.max(0, value - envelope[index - 1]));
  const minimumLag = Math.round(60 / maximumBpm / hopSeconds);
  const maximumLag = Math.round(60 / minimumBpm / hopSeconds);
  if (onsets.length < maximumLag * 2) return undefined;

  let bestLag = 0;
  let bestScore = 0;
  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    let score = 0;
    for (let index = lag; index < onsets.length; index += 1) score += onsets[index] * onsets[index - lag];
    if (score > bestScore) { bestScore = score; bestLag = lag; }
  }
  if (bestLag === 0 || bestScore === 0) return undefined;

  let bestOffset = 0;
  let bestPhase = -1;
  for (let offset = 0; offset < bestLag; offset += 1) {
    let phase = 0;
    for (let index = offset; index < onsets.length; index += bestLag) phase += onsets[index];
    if (phase > bestPhase) { bestPhase = phase; bestOffset = offset; }
  }

  const beatSeconds: number[] = [];
  for (let index = bestOffset; index < onsets.length; index += bestLag) beatSeconds.push(index * hopSeconds);
  return { beatSeconds, bpm: Math.round(60 / (bestLag * hopSeconds)) };
}

/**
 * Builds jump cuts so that each cut lands on a beat of the finished video:
 * keep footage for `beatsPerCut` beats, skip half that much, and repeat.
 */
export function createBeatCuts(beatSeconds: number[], beatsPerCut: number, playback: PlaybackSettings): TimeRange[] {
  const kept = getKeptRanges(playback);
  const total = kept.reduce((sum, range) => sum + range.endSeconds - range.startSeconds, 0);
  const cuts: TimeRange[] = [];
  let keptCursor = 0;
  for (let index = 0; index + beatsPerCut < beatSeconds.length; index += beatsPerCut) {
    const sectionSeconds = (beatSeconds[index + beatsPerCut] - beatSeconds[index]) * playback.speed;
    const skipSeconds = sectionSeconds / 2;
    keptCursor += index === 0 ? beatSeconds[beatsPerCut] * playback.speed : sectionSeconds;
    if (keptCursor + skipSeconds >= total) break;
    cuts.push(...mapKeptSectionToSource(keptCursor, keptCursor + skipSeconds, kept));
    keptCursor += skipSeconds;
  }
  return cuts;
}

function mapKeptSectionToSource(startKept: number, endKept: number, kept: TimeRange[]): TimeRange[] {
  const ranges: TimeRange[] = [];
  let cursor = 0;
  for (const range of kept) {
    const rangeSeconds = range.endSeconds - range.startSeconds;
    const start = Math.max(startKept, cursor);
    const end = Math.min(endKept, cursor + rangeSeconds);
    if (end > start) ranges.push({ startSeconds: range.startSeconds + start - cursor, endSeconds: range.startSeconds + end - cursor });
    cursor += rangeSeconds;
  }
  return ranges;
}
