import type { TextOverlay } from "@/features/project/text-overlays";
import { clamp } from "@/lib/clamp";

export type LogoCorner = "bottom-left" | "bottom-right" | "top-left" | "top-right";
export type SavedTextStyle = { change: Partial<TextOverlay>; id: string; name: string };

export interface BrandKit {
  accentColor: string;
  fontFamily: TextOverlay["fontFamily"];
  logoCorner: LogoCorner;
  logoDataUrl?: string;
  logoSizePercent: number;
  savedStyles: SavedTextStyle[];
  textColor: string;
}

export const logoCornerOptions: Array<{ label: string; value: LogoCorner }> = [
  { label: "Top left", value: "top-left" },
  { label: "Top right", value: "top-right" },
  { label: "Bottom left", value: "bottom-left" },
  { label: "Bottom right", value: "bottom-right" },
];

export const defaultBrandKit: BrandKit = { accentColor: "#22d3ee", fontFamily: "modern", logoCorner: "top-right", logoSizePercent: 14, savedStyles: [], textColor: "#ffffff" };

const storageKey = "vertara.brand-kit.v1";
const styleKeys = ["backgroundColor", "backgroundStyle", "color", "dropShadowBlurPercent", "dropShadowColor", "dropShadowOffsetXPercent", "dropShadowOffsetYPercent", "entranceAnimation", "fontFamily", "fontSizePercent", "shadowColor", "shadowSpreadPercent", "strokeColor", "strokeWidthPercent", "textAlign"] as const;

/** Reads a stored brand kit defensively: anything missing or malformed falls back to the default. */
export function parseBrandKit(stored: string | null): BrandKit {
  if (!stored) return defaultBrandKit;
  try {
    const parsed = JSON.parse(stored) as Partial<BrandKit>;
    return { ...defaultBrandKit, ...parsed, logoSizePercent: clamp(Number(parsed.logoSizePercent ?? defaultBrandKit.logoSizePercent), 6, 30), savedStyles: Array.isArray(parsed.savedStyles) ? parsed.savedStyles : [] };
  } catch {
    return defaultBrandKit;
  }
}

export function loadBrandKit(): BrandKit {
  try { return parseBrandKit(window.localStorage.getItem(storageKey)); } catch { return defaultBrandKit; }
}

export function saveBrandKit(kit: BrandKit): void {
  try { window.localStorage.setItem(storageKey, JSON.stringify(kit)); } catch { /* Private windows and full storage keep the kit for this session only. */ }
}

/** Copies only the look of a text layer, never its words, timing, or position. */
export function createSavedTextStyle(id: string, name: string, overlay: TextOverlay): SavedTextStyle {
  return { change: Object.fromEntries(styleKeys.map((key) => [key, overlay[key]])) as Partial<TextOverlay>, id, name };
}

export function getLogoBox(corner: LogoCorner, sizePercent: number, frameWidth: number, frameHeight: number, logoWidth: number, logoHeight: number): { height: number; width: number; x: number; y: number } {
  const margin = frameWidth * 0.04;
  const width = frameWidth * (sizePercent / 100);
  const height = width * (logoHeight / logoWidth);
  return { height, width, x: corner.endsWith("left") ? margin : frameWidth - margin - width, y: corner.startsWith("top") ? margin : frameHeight - margin - height };
}
