export const playbackSpeeds = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export type PlaybackSpeed = (typeof playbackSpeeds)[number];

export interface PlaybackSettings {
  muted: boolean;
  speed: PlaybackSpeed;
  trimEndSeconds: number;
  trimStartSeconds: number;
}

export function createPlaybackSettings(
  durationSeconds: number,
  partialSettings: Partial<PlaybackSettings> = {},
): PlaybackSettings {
  const trimStartSeconds = Math.min(Math.max(partialSettings.trimStartSeconds ?? 0, 0), durationSeconds);
  const requestedEndSeconds = partialSettings.trimEndSeconds ?? durationSeconds;
  const trimEndSeconds = Math.min(Math.max(requestedEndSeconds, trimStartSeconds + 0.1), durationSeconds);

  return {
    muted: partialSettings.muted ?? false,
    speed: isPlaybackSpeed(partialSettings.speed) ? partialSettings.speed : 1,
    trimStartSeconds,
    trimEndSeconds,
  };
}

export function getExportDurationSeconds(playback: PlaybackSettings): number {
  return Math.max(0, playback.trimEndSeconds - playback.trimStartSeconds) / playback.speed;
}

export function getOutputElapsedSeconds(sourceElapsedSeconds: number, playback: PlaybackSettings): number {
  return Math.max(0, sourceElapsedSeconds) / playback.speed;
}

function isPlaybackSpeed(value: number | undefined): value is PlaybackSpeed {
  return value !== undefined && playbackSpeeds.includes(value as PlaybackSpeed);
}
