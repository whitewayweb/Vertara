const textFontFamilies = ["headline", "modern", "rounded", "editorial", "typewriter", "mono"] as const;
const textEntranceAnimations = ["none", "fade", "pop", "slide-up"] as const;
const textAlignments = ["left", "center", "right"] as const;
export type TextEntranceAnimation = (typeof textEntranceAnimations)[number];
export type TextAlignment = (typeof textAlignments)[number];
export const textEntranceAnimationOptions = [
  { label: "None", value: "none" },
  { label: "Fade", value: "fade" },
  { label: "Pop", value: "pop" },
  { label: "Slide up", value: "slide-up" },
] as const;
export const textAlignmentOptions = textAlignments.map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value })) as Array<{ label: string; value: TextAlignment }>;
export const textOverlayTemplates = [
  { backgroundColor: "#000000cc", entranceAnimation: "pop", fontFamily: "headline", label: "Hook", text: "Stop scrolling", verticalPositionPercent: 16 },
  { backgroundColor: "transparent", entranceAnimation: "fade", fontFamily: "editorial", label: "Quote", text: "A moment worth sharing", verticalPositionPercent: 50 },
  { backgroundColor: "#ffffff", color: "#111827", entranceAnimation: "slide-up", fontFamily: "rounded", label: "CTA", text: "Follow for more", verticalPositionPercent: 84 },
] as const satisfies ReadonlyArray<{ label: string } & Partial<TextOverlay>>;
export const textFontOptions = [
  { label: "Headline", value: "headline" },
  { label: "Modern", value: "modern" },
  { label: "Rounded", value: "rounded" },
  { label: "Editorial", value: "editorial" },
  { label: "Typewriter", value: "typewriter" },
  { label: "Mono", value: "mono" },
] as const;
export interface TextOverlay { backgroundColor: string; color: string; durationSeconds: number; entranceAnimation: TextEntranceAnimation; fontFamily: (typeof textFontFamilies)[number]; fontSizePercent: number; horizontalPositionPercent: number; id: string; startSeconds: number; text: string; textAlign: TextAlignment; verticalPositionPercent: number; widthPercent: number; }
const defaults = { backgroundColor: "#000000", color: "#ffffff", durationSeconds: 2, entranceAnimation: "pop" as const, fontFamily: "headline" as const, fontSizePercent: 7, horizontalPositionPercent: 50, startSeconds: 0, text: "", textAlign: "center" as const, verticalPositionPercent: 16, widthPercent: 60 };
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
  const entranceAnimation = partial.entranceAnimation ?? defaults.entranceAnimation;
  const textAlign = partial.textAlign ?? defaults.textAlign;
  return { backgroundColor: backgroundColor(partial.backgroundColor ?? defaults.backgroundColor), color: color(partial.color ?? defaults.color, defaults.color), durationSeconds: clamp(partial.durationSeconds ?? defaults.durationSeconds, 0.5, 300), entranceAnimation: textEntranceAnimations.includes(entranceAnimation) ? entranceAnimation : defaults.entranceAnimation, fontFamily: textFontFamilies.includes(fontFamily) ? fontFamily : defaults.fontFamily, fontSizePercent: clamp(partial.fontSizePercent ?? defaults.fontSizePercent, 4, 12), horizontalPositionPercent: clamp(partial.horizontalPositionPercent ?? defaults.horizontalPositionPercent, 7, 93), id, startSeconds: Math.max(partial.startSeconds ?? defaults.startSeconds, 0), text: (partial.text ?? defaults.text).slice(0, 280), textAlign: textAlignments.includes(textAlign) ? textAlign : defaults.textAlign, verticalPositionPercent: clamp(partial.verticalPositionPercent ?? defaults.verticalPositionPercent, 5, 95), widthPercent: clamp(partial.widthPercent ?? defaults.widthPercent, 20, 86) };
}
export function getTextOverlayFontStack(fontFamily: TextOverlay["fontFamily"]): string { return fontStacks[fontFamily]; }
export function isTextOverlayVisible(overlay: TextOverlay, elapsedSeconds: number): boolean { return Boolean(overlay.text.trim()) && elapsedSeconds >= overlay.startSeconds && elapsedSeconds < overlay.startSeconds + overlay.durationSeconds; }
export function getTextOverlayEntranceAnimation(animation: TextEntranceAnimation): string | undefined { return animation === "none" ? undefined : `vertara-text-${animation} 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both`; }
export function getTextOverlayEntranceProgress(overlay: TextOverlay, elapsedSeconds: number): number { return clamp((elapsedSeconds - overlay.startSeconds) / 0.26, 0, 1); }
export function duplicateTextOverlay(overlay: TextOverlay, id: string): TextOverlay { return createTextOverlay(id, { ...overlay, horizontalPositionPercent: Math.min(93, overlay.horizontalPositionPercent + 4), verticalPositionPercent: Math.min(95, overlay.verticalPositionPercent + 4) }); }
