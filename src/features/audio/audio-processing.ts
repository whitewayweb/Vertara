import { getRmsEnvelope } from "@/features/audio/silence-detection";
import type { TimeRange } from "@/features/project/playback-settings";
import { clamp } from "@/lib/clamp";

const joinFadeSeconds = 0.005;

/** Joins the kept sections of a channel, fading each join so cuts do not click. */
export function extractKeptSamples(samples: Float32Array, sampleRate: number, ranges: TimeRange[]): Float32Array {
  const fadeLength = Math.round(sampleRate * joinFadeSeconds);
  const sections = ranges.map((range) => samples.subarray(Math.round(range.startSeconds * sampleRate), Math.round(range.endSeconds * sampleRate)));
  const output = new Float32Array(sections.reduce((total, section) => total + section.length, 0));
  let offset = 0;
  for (const section of sections) {
    output.set(section, offset);
    const length = Math.min(fadeLength, Math.floor(section.length / 2));
    for (let index = 0; index < length; index += 1) {
      const gain = index / length;
      output[offset + index] *= gain;
      output[offset + section.length - 1 - index] *= gain;
    }
    offset += section.length;
  }
  return output;
}

/** Speeds audio up without raising its pitch, matching the browser's preview, using WSOLA overlap-add. */
export function timeStretch(samples: Float32Array, speed: number, sampleRate: number): Float32Array {
  if (speed === 1) return samples;
  const windowLength = Math.round(sampleRate * 0.04);
  const synthesisHop = Math.round(windowLength / 2);
  const analysisHop = Math.round(synthesisHop * speed);
  const searchRadius = Math.round(sampleRate * 0.008);
  const outputLength = Math.ceil(samples.length / speed);
  const output = new Float32Array(outputLength + windowLength);
  const weights = new Float32Array(outputLength + windowLength);
  const window = Float32Array.from({ length: windowLength }, (_, index) => 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (windowLength - 1)));

  let previousEnd = 0;
  for (let frame = 0; frame * synthesisHop < outputLength; frame += 1) {
    const target = frame * analysisHop;
    let source = target;
    if (frame > 0) {
      // Pick the nearby position that best continues the previous grain's waveform.
      let bestScore = -Infinity;
      const compareLength = Math.min(synthesisHop, 512);
      for (let candidate = Math.max(0, target - searchRadius); candidate <= target + searchRadius; candidate += 4) {
        if (candidate + compareLength >= samples.length || previousEnd + compareLength >= samples.length) break;
        let score = 0;
        for (let index = 0; index < compareLength; index += 8) score += samples[candidate + index] * samples[previousEnd + index];
        if (score > bestScore) { bestScore = score; source = candidate; }
      }
    }
    const outputStart = frame * synthesisHop;
    for (let index = 0; index < windowLength && source + index < samples.length; index += 1) {
      output[outputStart + index] += samples[source + index] * window[index];
      weights[outputStart + index] += window[index];
    }
    previousEnd = source + synthesisHop;
  }
  for (let index = 0; index < output.length; index += 1) if (weights[index] > 0.001) output[index] /= weights[index];
  return output.subarray(0, outputLength);
}

/** Quietens the steady background noise heard between words. */
export function applyNoiseGate(samples: Float32Array, sampleRate: number): Float32Array {
  const windowSize = Math.max(1, Math.round(sampleRate * 0.02));
  const envelope = getRmsEnvelope(samples, windowSize);
  if (envelope.length === 0) return samples;
  const sorted = Float32Array.from(envelope).sort();
  const threshold = sorted[Math.floor(sorted.length * 0.15)] * 2.5;
  const output = new Float32Array(samples.length);
  const closedGain = 0.25;
  const attack = 1 / (sampleRate * 0.005);
  const release = 1 / (sampleRate * 0.12);
  let gain = 1;
  for (let index = 0; index < samples.length; index += 1) {
    const level = envelope[Math.min(envelope.length - 1, Math.floor(index / windowSize))];
    const target = level > threshold ? 1 : closedGain;
    gain += clamp(target - gain, -release, attack);
    output[index] = samples[index] * gain;
  }
  return output;
}

/** Brings speech to a consistent social-video loudness without clipping. */
export function normalizeLoudness(channels: Float32Array[], sampleRate: number, targetRms = 0.1): void {
  const windowSize = Math.max(1, Math.round(sampleRate * 0.4));
  const levels = channels.flatMap((channel) => Array.from(getRmsEnvelope(channel, windowSize)));
  const voiced = levels.filter((level) => level > 0.005).sort((a, b) => a - b);
  if (voiced.length === 0) return;
  const speechLevel = voiced[Math.floor(voiced.length * 0.7)];
  let peak = 0;
  for (const channel of channels) for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
  const gain = Math.min(targetRms / speechLevel, 0.97 / peak, 8);
  for (const channel of channels) for (let index = 0; index < channel.length; index += 1) channel[index] *= gain;
}

/** Mixes music under the voice, optionally lowering it whenever someone is speaking. */
export function mixMusic(voice: Float32Array | undefined, music: Float32Array, sampleRate: number, volume: number, duck: boolean, outputLength: number): Float32Array {
  const output = new Float32Array(outputLength);
  const windowSize = Math.max(1, Math.round(sampleRate * 0.05));
  const envelope = voice && duck ? getRmsEnvelope(voice, windowSize) : undefined;
  const fadeOutSamples = Math.min(sampleRate, Math.floor(outputLength / 4));
  const smoothing = 1 / (sampleRate * 0.15);
  let duckGain = 1;
  for (let index = 0; index < outputLength; index += 1) {
    const isSpeaking = envelope ? (envelope[Math.floor(index / windowSize)] ?? 0) > 0.015 : false;
    duckGain += clamp((isSpeaking ? musicDuckGain : 1) - duckGain, -smoothing, smoothing);
    const fade = Math.min(1, (outputLength - index) / Math.max(1, fadeOutSamples));
    output[index] = (voice?.[index] ?? 0) + music[index % music.length] * volume * duckGain * fade;
  }
  return output;
}

export const musicDuckGain = 0.3;
