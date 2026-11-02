import { clamp } from "@/lib/clamp";

const textFontFamilies = ["headline", "modern", "rounded", "editorial", "typewriter", "mono"] as const;
const textEntranceAnimations = ["none", "fade", "pop", "slide-up"] as const;
const textAlignments = ["left", "center", "right"] as const;
const textBackgroundStyles = ["none", "box", "highlight", "pill"] as const;
const textOverlayKinds = ["text", "hook", "quote", "cta", "sticker"] as const;
export type TextEntranceAnimation = (typeof textEntranceAnimations)[number];
export type TextAlignment = (typeof textAlignments)[number];
type TextBackgroundStyle = (typeof textBackgroundStyles)[number];
export type TextOverlayKind = (typeof textOverlayKinds)[number];
export const textEntranceAnimationOptions = [
  { label: "None", value: "none" },
  { label: "Fade", value: "fade" },
  { label: "Pop", value: "pop" },
  { label: "Slide up", value: "slide-up" },
] as const;
export const textAlignmentOptions = textAlignments.map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value })) as Array<{ label: string; value: TextAlignment }>;
export const textBackgroundStyleOptions = [
  { label: "None", value: "none" },
  { label: "Box", value: "box" },
  { label: "Highlight", value: "highlight" },
  { label: "Pill", value: "pill" },
] as const;
export const textOverlayTemplates = [
  { backgroundColor: "transparent", entranceAnimation: "fade", fontFamily: "modern", kind: "text", label: "Text", text: "Add your message", verticalPositionPercent: 50 },
  { backgroundColor: "#000000cc", entranceAnimation: "pop", fontFamily: "headline", kind: "hook", label: "Hook", text: "Stop scrolling", verticalPositionPercent: 16 },
  { backgroundColor: "transparent", entranceAnimation: "fade", fontFamily: "editorial", kind: "quote", label: "Quote", text: "A moment worth sharing", verticalPositionPercent: 50 },
  { backgroundColor: "#ffffff", color: "#111827", entranceAnimation: "slide-up", fontFamily: "rounded", kind: "cta", label: "CTA", text: "Follow for more", verticalPositionPercent: 84 },
] as const satisfies ReadonlyArray<{ label: string } & Partial<TextOverlay>>;
export const textFontOptions = [
  { label: "Headline", value: "headline" },
  { label: "Modern", value: "modern" },
  { label: "Rounded", value: "rounded" },
  { label: "Editorial", value: "editorial" },
  { label: "Typewriter", value: "typewriter" },
  { label: "Mono", value: "mono" },
] as const;
export interface TextOverlay { backgroundColor: string; backgroundStyle: TextBackgroundStyle; color: string; dropShadowBlurPercent: number; dropShadowColor: string; dropShadowOffsetXPercent: number; dropShadowOffsetYPercent: number; durationSeconds: number; entranceAnimation: TextEntranceAnimation; fontFamily: (typeof textFontFamilies)[number]; fontSizePercent: number; horizontalPositionPercent: number; id: string; kind: TextOverlayKind; shadowColor: string; shadowSpreadPercent: number; startSeconds: number; strokeColor: string; strokeWidthPercent: number; text: string; textAlign: TextAlignment; verticalPositionPercent: number; widthPercent: number; }
const defaults = { backgroundColor: "#000000", backgroundStyle: "box" as const, color: "#ffffff", dropShadowBlurPercent: 0, dropShadowColor: "transparent", dropShadowOffsetXPercent: 0, dropShadowOffsetYPercent: 0, durationSeconds: 2, entranceAnimation: "pop" as const, fontFamily: "headline" as const, fontSizePercent: 7, horizontalPositionPercent: 50, kind: "text" as const, shadowColor: "transparent", shadowSpreadPercent: 0, startSeconds: 0, strokeColor: "transparent", strokeWidthPercent: 0, text: "", textAlign: "center" as const, verticalPositionPercent: 16, widthPercent: 60 };
export const textStylePresets = [
  { label: "Classic", value: "classic", change: { backgroundColor: "transparent", backgroundStyle: "none" as const, color: "#ffffff", fontFamily: "modern" as const, shadowColor: "#000000cc", shadowSpreadPercent: 4, strokeColor: "transparent", strokeWidthPercent: 0 } },
  { label: "Strong", value: "strong", change: { backgroundColor: "#000000cc", backgroundStyle: "box" as const, color: "#ffffff", fontFamily: "headline" as const, shadowColor: "transparent", shadowSpreadPercent: 0, strokeColor: "transparent", strokeWidthPercent: 0 } },
  { label: "Neon", value: "neon", change: { backgroundColor: "transparent", backgroundStyle: "none" as const, color: "#f8fafc", fontFamily: "rounded" as const, shadowColor: "#22d3ee", shadowSpreadPercent: 18, strokeColor: "#0e7490", strokeWidthPercent: 2 } },
  { label: "Highlight", value: "highlight", change: { backgroundColor: "#facc15", backgroundStyle: "highlight" as const, color: "#111827", fontFamily: "modern" as const, shadowColor: "transparent", shadowSpreadPercent: 0, strokeColor: "transparent", strokeWidthPercent: 0 } },
  { label: "Typewriter", value: "typewriter", change: { backgroundColor: "#f8fafc", backgroundStyle: "pill" as const, color: "#111827", fontFamily: "typewriter" as const, shadowColor: "transparent", shadowSpreadPercent: 0, strokeColor: "transparent", strokeWidthPercent: 0 } },
] as const satisfies ReadonlyArray<{ change: Partial<TextOverlay>; label: string; value: string }>;
const fontStacks = {
  editorial: 'Georgia, "Times New Roman", serif',
  headline: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  modern: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Courier New", Courier, monospace',
  rounded: '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif',
  typewriter: '"American Typewriter", "Courier New", serif',
} as const;
const color = (value: string, fallback: string) => /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value) ? value : fallback;
const backgroundColor = (value: string) => value === "transparent" ? value : color(value, defaults.backgroundColor);
const optionalColor = (value: string) => value === "transparent" ? value : color(value, "transparent");
export function createTextOverlay(id: string, partial: Partial<TextOverlay> = {}): TextOverlay {
  const fontFamily = partial.fontFamily ?? defaults.fontFamily;
  const entranceAnimation = partial.entranceAnimation ?? defaults.entranceAnimation;
  const kind = partial.kind ?? defaults.kind;
  const textAlign = partial.textAlign ?? defaults.textAlign;
  const backgroundStyle = partial.backgroundStyle ?? defaults.backgroundStyle;
  return { backgroundColor: backgroundColor(partial.backgroundColor ?? defaults.backgroundColor), backgroundStyle: textBackgroundStyles.includes(backgroundStyle) ? backgroundStyle : defaults.backgroundStyle, color: color(partial.color ?? defaults.color, defaults.color), dropShadowBlurPercent: clamp(partial.dropShadowBlurPercent ?? defaults.dropShadowBlurPercent, 0, 30), dropShadowColor: optionalColor(partial.dropShadowColor ?? defaults.dropShadowColor), dropShadowOffsetXPercent: clamp(partial.dropShadowOffsetXPercent ?? defaults.dropShadowOffsetXPercent, -12, 12), dropShadowOffsetYPercent: clamp(partial.dropShadowOffsetYPercent ?? defaults.dropShadowOffsetYPercent, -12, 12), durationSeconds: clamp(partial.durationSeconds ?? defaults.durationSeconds, 0.5, 300), entranceAnimation: textEntranceAnimations.includes(entranceAnimation) ? entranceAnimation : defaults.entranceAnimation, fontFamily: textFontFamilies.includes(fontFamily) ? fontFamily : defaults.fontFamily, fontSizePercent: clamp(partial.fontSizePercent ?? defaults.fontSizePercent, 4, 12), horizontalPositionPercent: clamp(partial.horizontalPositionPercent ?? defaults.horizontalPositionPercent, 7, 93), id, kind: textOverlayKinds.includes(kind) ? kind : defaults.kind, shadowColor: optionalColor(partial.shadowColor ?? defaults.shadowColor), shadowSpreadPercent: clamp(partial.shadowSpreadPercent ?? defaults.shadowSpreadPercent, 0, 30), startSeconds: Math.max(partial.startSeconds ?? defaults.startSeconds, 0), strokeColor: optionalColor(partial.strokeColor ?? defaults.strokeColor), strokeWidthPercent: clamp(partial.strokeWidthPercent ?? defaults.strokeWidthPercent, 0, 12), text: (partial.text ?? defaults.text).slice(0, 280), textAlign: textAlignments.includes(textAlign) ? textAlign : defaults.textAlign, verticalPositionPercent: clamp(partial.verticalPositionPercent ?? defaults.verticalPositionPercent, 5, 95), widthPercent: clamp(partial.widthPercent ?? defaults.widthPercent, 20, 86) };
}
export function getTextOverlayFontStack(fontFamily: TextOverlay["fontFamily"]): string { return fontStacks[fontFamily]; }
export function isTextOverlayVisible(overlay: TextOverlay, elapsedSeconds: number): boolean { return Boolean(overlay.text.trim()) && elapsedSeconds >= overlay.startSeconds && elapsedSeconds < overlay.startSeconds + overlay.durationSeconds; }
export function getTextOverlayEntranceAnimation(animation: TextEntranceAnimation): string | undefined { return animation === "none" ? undefined : `vertara-text-${animation} 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both`; }
export function getTextOverlayEntranceProgress(overlay: TextOverlay, elapsedSeconds: number): number { return clamp((elapsedSeconds - overlay.startSeconds) / 0.26, 0, 1); }
export function duplicateTextOverlay(overlay: TextOverlay, id: string): TextOverlay { return createTextOverlay(id, { ...overlay, horizontalPositionPercent: Math.min(93, overlay.horizontalPositionPercent + 4), verticalPositionPercent: Math.min(95, overlay.verticalPositionPercent + 4) }); }
