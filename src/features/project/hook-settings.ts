export type HookPosition = "top" | "center" | "bottom";

export interface HookSettings {
  durationSeconds: number;
  enabled: boolean;
  position: HookPosition;
  text: string;
}

const defaultHookSettings: HookSettings = {
  durationSeconds: 2,
  enabled: false,
  position: "top",
  text: "",
};

export function createHookSettings(partialSettings: Partial<HookSettings> = {}): HookSettings {
  const requestedDuration = partialSettings.durationSeconds ?? defaultHookSettings.durationSeconds;

  return {
    durationSeconds: Math.min(Math.max(requestedDuration, 0.5), 5),
    enabled: partialSettings.enabled ?? defaultHookSettings.enabled,
    position: partialSettings.position ?? defaultHookSettings.position,
    text: partialSettings.text ?? defaultHookSettings.text,
  };
}
