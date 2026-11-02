import type { CSSProperties } from "react";

import { getActiveCaption, type CaptionLine, type CaptionSettings } from "@/features/captions/captions";
import { getTextOverlayFontStack } from "@/features/project/text-overlays";

interface CaptionOverlayProps {
  lines: CaptionLine[];
  settings: CaptionSettings;
  sourceSeconds: number;
}

export function CaptionOverlay({ lines, settings, sourceSeconds }: CaptionOverlayProps) {
  const active = settings.enabled ? getActiveCaption(lines, sourceSeconds) : undefined;
  if (!active) return null;
  const hasBox = settings.backgroundColor !== "transparent";
  const textStyle: CSSProperties = hasBox
    ? { backgroundColor: settings.backgroundColor, borderRadius: "0.25em", boxDecorationBreak: "clone", padding: "0.05em 0.25em", WebkitBoxDecorationBreak: "clone" }
    : { paintOrder: "stroke fill", WebkitTextStroke: "0.14em #000000" };
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ containerType: "inline-size" }}><p className="absolute left-[7%] w-[86%] -translate-y-1/2 text-center font-extrabold leading-[1.25]" style={{ color: settings.color, fontFamily: getTextOverlayFontStack(settings.fontFamily), fontSize: `${settings.sizePercent}cqw`, top: `${settings.verticalPositionPercent}%` }}><span style={textStyle}>{active.line.words.map((word, index) => <span key={word.id} style={word.id === active.activeWordId ? { color: settings.highlightColor } : undefined}>{index > 0 ? " " : ""}{word.text}</span>)}</span></p></div>;
}
