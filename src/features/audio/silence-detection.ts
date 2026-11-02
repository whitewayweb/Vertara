import type { TimeRange } from "@/features/project/playback-settings";

export const silenceSensitivities = [
  { label: "Gentle", value: "gentle", description: "Only long pauses", minimumSilenceSeconds: 1 },
  { label: "Balanced", value: "balanced", description: "Natural pacing", minimumSilenceSeconds: 0.6 },
  { label: "Tight", value: "tight", description: "Fast, punchy pacing", minimumSilenceSeconds: 0.35 },
] as const;
export type SilenceSensitivity = (typeof silenceSensitivities)[number]["value"];

const windowSeconds = 0.02;
const paddingSeconds = 0.08;

export function getRmsEnvelope(samples: Float32Array, windowSize: number): Float32Array {
  const envelope = new Float32Array(Math.floor(samples.length / windowSize));
  for (let windowIndex = 0; windowIndex < envelope.length; windowIndex += 1) {
    let sum = 0;
    for (let sampleIndex = 0; sampleIndex < windowSize; sampleIndex += 1) {
      const sample = samples[windowIndex * windowSize + sampleIndex];
      sum += sample * sample;
    }
    envelope[windowIndex] = Math.sqrt(sum / windowSize);
  }
  return envelope;
}

/** Finds quiet sections, adapting to each recording's own noise floor and loudest speech. */
export function detectSilentRanges(samples: Float32Array, sampleRate: number, sensitivity: SilenceSensitivity = "balanced"): TimeRange[] {
  const windowSize = Math.max(1, Math.round(sampleRate * windowSeconds));
  const envelope = getRmsEnvelope(samples, windowSize);
  if (envelope.length === 0) return [];
  const sorted = Float32Array.from(envelope).sort();
  const noiseFloor = sorted[Math.floor(sorted.length * 0.1)];
  const speechLevel = sorted[Math.floor(sorted.length * 0.95)];
  if (speechLevel < 0.001) return [];
  const threshold = Math.max(noiseFloor * 2, speechLevel * 0.1);
  const minimumSilenceSeconds = silenceSensitivities.find((option) => option.value === sensitivity)?.minimumSilenceSeconds ?? 0.6;

  const ranges: TimeRange[] = [];
  let silenceStart: number | undefined;
  for (let index = 0; index <= envelope.length; index += 1) {
    const isSilent = index < envelope.length && envelope[index] < threshold;
    if (isSilent && silenceStart === undefined) silenceStart = index;
    if (!isSilent && silenceStart !== undefined) {
      const startSeconds = (silenceStart * windowSize) / sampleRate;
      const endSeconds = (index * windowSize) / sampleRate;
      if (endSeconds - startSeconds >= minimumSilenceSeconds) {
        // Keep a little air around speech so cuts do not clip the first or last syllable.
        ranges.push({ startSeconds: silenceStart === 0 ? 0 : startSeconds + paddingSeconds, endSeconds: index === envelope.length ? endSeconds : endSeconds - paddingSeconds });
      }
      silenceStart = undefined;
    }
  }
  return ranges;
}
