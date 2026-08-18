export type HookPosition = "top" | "center" | "bottom";

export interface HookSettings {
  backgroundColor: string;
  durationSeconds: number;
  enabled: boolean;
  fontSizePercent: number;
  position: HookPosition;
  text: string;
}

const defaultHookSettings: HookSettings = {
  backgroundColor: "#000000",
  durationSeconds: 2,
  enabled: false,
  fontSizePercent: 7,
  position: "top",
  text: "",
};

export function createHookSettings(partialSettings: Partial<HookSettings> = {}): HookSettings {
  const requestedDuration = partialSettings.durationSeconds ?? defaultHookSettings.durationSeconds;
  const requestedFontSize = partialSettings.fontSizePercent ?? defaultHookSettings.fontSizePercent;
  const requestedBackgroundColor = partialSettings.backgroundColor ?? defaultHookSettings.backgroundColor;

  return {
    backgroundColor: /^#[0-9a-f]{6}$/i.test(requestedBackgroundColor) ? requestedBackgroundColor : defaultHookSettings.backgroundColor,
    durationSeconds: Math.min(Math.max(requestedDuration, 0.5), 5),
    enabled: partialSettings.enabled ?? defaultHookSettings.enabled,
    fontSizePercent: Math.min(Math.max(requestedFontSize, 4), 12),
    position: partialSettings.position ?? defaultHookSettings.position,
    text: partialSettings.text ?? defaultHookSettings.text,
  };
}
