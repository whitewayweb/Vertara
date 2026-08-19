const textFontFamilies = ["headline", "modern", "rounded", "editorial", "typewriter", "mono"] as const;
export const textFontOptions = [
  { label: "Headline", value: "headline" },
  { label: "Modern", value: "modern" },
  { label: "Rounded", value: "rounded" },
  { label: "Editorial", value: "editorial" },
  { label: "Typewriter", value: "typewriter" },
  { label: "Mono", value: "mono" },
] as const;
export interface TextOverlay { backgroundColor: string; color: string; durationSeconds: number; fontFamily: (typeof textFontFamilies)[number]; fontSizePercent: number; horizontalPositionPercent: number; id: string; startSeconds: number; text: string; verticalPositionPercent: number; widthPercent: number; }
const defaults = { backgroundColor: "#000000", color: "#ffffff", durationSeconds: 2, fontFamily: "headline" as const, fontSizePercent: 7, horizontalPositionPercent: 50, startSeconds: 0, text: "", verticalPositionPercent: 16, widthPercent: 60 };
const fontStacks = {
  editorial: 'Georgia, "Times New Roman", serif',
  headline: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  modern: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Courier New", Courier, monospace',
  rounded: '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif',
  typewriter: '"American Typewriter", "Courier New", serif',
} as const;
const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);
const color = (value: string, fallback: string) => /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value) ? value : fallback;
const backgroundColor = (value: string) => value === "transparent" ? value : color(value, defaults.backgroundColor);
export function createTextOverlay(id: string, partial: Partial<TextOverlay> = {}): TextOverlay {
  const fontFamily = partial.fontFamily ?? defaults.fontFamily;
  return { backgroundColor: backgroundColor(partial.backgroundColor ?? defaults.backgroundColor), color: color(partial.color ?? defaults.color, defaults.color), durationSeconds: clamp(partial.durationSeconds ?? defaults.durationSeconds, 0.5, 300), fontFamily: textFontFamilies.includes(fontFamily) ? fontFamily : defaults.fontFamily, fontSizePercent: clamp(partial.fontSizePercent ?? defaults.fontSizePercent, 4, 12), horizontalPositionPercent: clamp(partial.horizontalPositionPercent ?? defaults.horizontalPositionPercent, 7, 93), id, startSeconds: Math.max(partial.startSeconds ?? defaults.startSeconds, 0), text: (partial.text ?? defaults.text).slice(0, 280), verticalPositionPercent: clamp(partial.verticalPositionPercent ?? defaults.verticalPositionPercent, 5, 95), widthPercent: clamp(partial.widthPercent ?? defaults.widthPercent, 20, 86) };
}
export function getTextOverlayFontStack(fontFamily: TextOverlay["fontFamily"]): string { return fontStacks[fontFamily]; }
export function isTextOverlayVisible(overlay: TextOverlay, elapsedSeconds: number): boolean { return Boolean(overlay.text.trim()) && elapsedSeconds >= overlay.startSeconds && elapsedSeconds < overlay.startSeconds + overlay.durationSeconds; }
