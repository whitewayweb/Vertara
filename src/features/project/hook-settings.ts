export interface HookSettings {
  backgroundColor: string;
  durationSeconds: number;
  enabled: boolean;
  fontSizePercent: number;
  horizontalPositionPercent: number;
  text: string;
  verticalPositionPercent: number;
  widthPercent: number;
}

const defaultHookSettings: HookSettings = {
  backgroundColor: "#000000",
  durationSeconds: 2,
  enabled: false,
  fontSizePercent: 7,
  horizontalPositionPercent: 50,
  text: "",
  verticalPositionPercent: 9,
  widthPercent: 60,
};

export function createHookSettings(partialSettings: Partial<HookSettings> = {}): HookSettings {
  const requestedDuration = partialSettings.durationSeconds ?? defaultHookSettings.durationSeconds;
  const requestedFontSize = partialSettings.fontSizePercent ?? defaultHookSettings.fontSizePercent;
  const requestedBackgroundColor = partialSettings.backgroundColor ?? defaultHookSettings.backgroundColor;
  const requestedHorizontalPosition = partialSettings.horizontalPositionPercent ?? defaultHookSettings.horizontalPositionPercent;
  const requestedVerticalPosition = partialSettings.verticalPositionPercent ?? defaultHookSettings.verticalPositionPercent;
  const requestedWidth = partialSettings.widthPercent ?? defaultHookSettings.widthPercent;

  return {
    backgroundColor: /^#[0-9a-f]{6}$/i.test(requestedBackgroundColor) ? requestedBackgroundColor : defaultHookSettings.backgroundColor,
    durationSeconds: Math.min(Math.max(requestedDuration, 0.5), 5),
    enabled: partialSettings.enabled ?? defaultHookSettings.enabled,
    fontSizePercent: Math.min(Math.max(requestedFontSize, 4), 12),
    horizontalPositionPercent: Math.min(Math.max(requestedHorizontalPosition, 7), 93),
    text: partialSettings.text ?? defaultHookSettings.text,
    verticalPositionPercent: Math.min(Math.max(requestedVerticalPosition, 5), 95),
    widthPercent: Math.min(Math.max(requestedWidth, 20), 86),
  };
}
