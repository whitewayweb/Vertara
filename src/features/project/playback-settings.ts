export interface PlaybackSettings {
  muted: boolean;
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
    trimStartSeconds,
    trimEndSeconds,
  };
}
