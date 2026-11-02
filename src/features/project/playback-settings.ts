export const playbackSpeeds = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export type PlaybackSpeed = (typeof playbackSpeeds)[number];

export interface TimeRange {
  endSeconds: number;
  startSeconds: number;
}

export interface PlaybackSettings {
  muted: boolean;
  /** Source-time sections skipped by preview and export, sorted and non-overlapping. */
  removedRanges: TimeRange[];
  speed: PlaybackSpeed;
  trimEndSeconds: number;
  trimStartSeconds: number;
}

const minimumRangeSeconds = 0.01;

export function createPlaybackSettings(
  durationSeconds: number,
  partialSettings: Partial<PlaybackSettings> = {},
): PlaybackSettings {
  const trimStartSeconds = Math.min(Math.max(partialSettings.trimStartSeconds ?? 0, 0), durationSeconds);
  const requestedEndSeconds = partialSettings.trimEndSeconds ?? durationSeconds;
  const trimEndSeconds = Math.min(Math.max(requestedEndSeconds, trimStartSeconds + 0.1), durationSeconds);

  return {
    muted: partialSettings.muted ?? false,
    removedRanges: normalizeRemovedRanges(partialSettings.removedRanges ?? [], trimStartSeconds, trimEndSeconds),
    speed: isPlaybackSpeed(partialSettings.speed) ? partialSettings.speed : 1,
    trimStartSeconds,
    trimEndSeconds,
  };
}

/** The source-time sections that make it into the finished video. */
export function getKeptRanges(playback: PlaybackSettings): TimeRange[] {
  const kept: TimeRange[] = [];
  let cursor = playback.trimStartSeconds;
  for (const range of playback.removedRanges) {
    if (range.startSeconds > cursor) kept.push({ startSeconds: cursor, endSeconds: range.startSeconds });
    cursor = Math.max(cursor, range.endSeconds);
  }
  if (playback.trimEndSeconds > cursor) kept.push({ startSeconds: cursor, endSeconds: playback.trimEndSeconds });
  return kept;
}

export function getExportDurationSeconds(playback: PlaybackSettings): number {
  return getKeptSeconds(playback) / playback.speed;
}

export function getKeptSeconds(playback: PlaybackSettings): number {
  return getKeptRanges(playback).reduce((total, range) => total + range.endSeconds - range.startSeconds, 0);
}

/** Converts elapsed source time since the trim start into finished-video time. */
export function getOutputElapsedSeconds(sourceElapsedSeconds: number, playback: PlaybackSettings): number {
  const sourceSeconds = playback.trimStartSeconds + Math.max(0, sourceElapsedSeconds);
  let keptSeconds = 0;
  for (const range of getKeptRanges(playback)) {
    if (sourceSeconds <= range.startSeconds) break;
    keptSeconds += Math.min(sourceSeconds, range.endSeconds) - range.startSeconds;
  }
  return keptSeconds / playback.speed;
}

/** Converts finished-video time back into the source time to show at that moment. */
export function getSourceSeconds(outputSeconds: number, playback: PlaybackSettings): number {
  let remainingSeconds = Math.max(0, outputSeconds) * playback.speed;
  const ranges = getKeptRanges(playback);
  for (const range of ranges) {
    const rangeSeconds = range.endSeconds - range.startSeconds;
    if (remainingSeconds < rangeSeconds) return range.startSeconds + remainingSeconds;
    remainingSeconds -= rangeSeconds;
  }
  return ranges.at(-1)?.endSeconds ?? playback.trimEndSeconds;
}

/** Returns where playback should be: the same time, or past a cut, or back at the loop start. */
export function getNextPlayableSeconds(sourceSeconds: number, playback: PlaybackSettings): number {
  const ranges = getKeptRanges(playback);
  const loopStart = ranges[0]?.startSeconds ?? playback.trimStartSeconds;
  for (const range of ranges) {
    if (sourceSeconds < range.startSeconds) return range.startSeconds;
    if (sourceSeconds < range.endSeconds) return sourceSeconds;
  }
  return loopStart;
}

function normalizeRemovedRanges(ranges: TimeRange[], trimStartSeconds: number, trimEndSeconds: number): TimeRange[] {
  const merged: TimeRange[] = [];
  const bounded = ranges
    .map((range) => ({ startSeconds: Math.max(range.startSeconds, trimStartSeconds), endSeconds: Math.min(range.endSeconds, trimEndSeconds) }))
    .filter((range) => range.endSeconds - range.startSeconds >= minimumRangeSeconds)
    .sort((a, b) => a.startSeconds - b.startSeconds);
  for (const range of bounded) {
    const previous = merged.at(-1);
    if (previous && range.startSeconds <= previous.endSeconds) previous.endSeconds = Math.max(previous.endSeconds, range.endSeconds);
    else merged.push({ ...range });
  }
  // Never let automatic cuts delete the entire video.
  const coversEverything = merged.length === 1 && merged[0].startSeconds <= trimStartSeconds && merged[0].endSeconds >= trimEndSeconds;
  return coversEverything ? [] : merged;
}

function isPlaybackSpeed(value: number | undefined): value is PlaybackSpeed {
  return value !== undefined && playbackSpeeds.includes(value as PlaybackSpeed);
}
