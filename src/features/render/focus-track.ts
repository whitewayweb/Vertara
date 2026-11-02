import { clamp } from "@/lib/clamp";

export interface FocusKeyframe {
  panX: number;
  timeSeconds: number;
}

interface FaceSample {
  /** Horizontal face centre as a 0–1 fraction of the source width. */
  centerX: number | undefined;
  timeSeconds: number;
}

/** Works out the pan that places a point of the source at the centre of a cover-cropped frame. */
export function getPanForCenter(centerX: number, sourceWidth: number, sourceHeight: number, outputWidth: number, outputHeight: number, zoom: number): number {
  const drawnWidth = sourceWidth * Math.max(outputWidth / sourceWidth, outputHeight / sourceHeight) * zoom;
  if (drawnWidth <= outputWidth) return 50;
  return clamp(((outputWidth / 2 - centerX * drawnWidth) / (outputWidth - drawnWidth)) * 100, 0, 100);
}

/** Turns raw face detections into a calm camera move: gaps are filled and jitter is smoothed. */
export function createFocusTrack(samples: FaceSample[], toPan: (centerX: number) => number): FocusKeyframe[] {
  const firstSeen = samples.find((sample) => sample.centerX !== undefined)?.centerX;
  if (firstSeen === undefined) return [];
  let lastCenter = firstSeen;
  const raw = samples.map((sample) => { lastCenter = sample.centerX ?? lastCenter; return toPan(lastCenter); });
  const smoothingRadius = 3;
  return samples.map((sample, index) => {
    const nearby = raw.slice(Math.max(0, index - smoothingRadius), index + smoothingRadius + 1);
    return { panX: nearby.reduce((total, value) => total + value, 0) / nearby.length, timeSeconds: sample.timeSeconds };
  });
}

export function getFocusPanAt(track: FocusKeyframe[], timeSeconds: number, fallbackPanX: number): number {
  if (track.length === 0) return fallbackPanX;
  const nextIndex = track.findIndex((keyframe) => keyframe.timeSeconds > timeSeconds);
  if (nextIndex === -1) return track[track.length - 1].panX;
  if (nextIndex === 0) return track[0].panX;
  const previous = track[nextIndex - 1];
  const next = track[nextIndex];
  return previous.panX + ((timeSeconds - previous.timeSeconds) / (next.timeSeconds - previous.timeSeconds)) * (next.panX - previous.panX);
}
