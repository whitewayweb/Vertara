import { useLayoutEffect, useRef, type PointerEvent } from "react";
import type { CSSProperties } from "react";

import type { TextOverlay } from "@/features/project/text-overlays";
import { cn } from "@/lib/utils";

type TextOverlayLayoutChange = Pick<TextOverlay, "horizontalPositionPercent" | "verticalPositionPercent" | "widthPercent">;
type DragMode = "move" | "resize-left" | "resize-right";
interface DragState extends TextOverlayLayoutChange { blockHeightPercent: number; mode: DragMode; }
interface VideoHookOverlayProps { className?: string; isSelected?: boolean; isVisible: boolean; onChange?(change: TextOverlayLayoutChange): void; onSelect?(): void; overlay: TextOverlay; }
const edgeMarginPercent = 1;
const minimumWidthPercent = 20;
const maximumWidthPercent = 86;
const fontClasses = { mono: "font-mono", sans: "font-sans", serif: "font-serif" } as const;
const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

export function VideoHookOverlay({ className, isSelected = false, isVisible, onChange, onSelect, overlay }: VideoHookOverlayProps) {
  const blockRef = useRef<HTMLDivElement>(null); const overlayRef = useRef<HTMLDivElement>(null); const dragStateRef = useRef<DragState | undefined>(undefined);
  useLayoutEffect(() => {
    const block = blockRef.current; const container = overlayRef.current; if (!block || !container) return;
    const blockBounds = block.getBoundingClientRect(); const containerBounds = container.getBoundingClientRect();
    const halfWidth = (blockBounds.width / containerBounds.width) * 50; const halfHeight = (blockBounds.height / containerBounds.height) * 50;
    const horizontalPositionPercent = clamp(overlay.horizontalPositionPercent, halfWidth + edgeMarginPercent, 100 - halfWidth - edgeMarginPercent);
    const verticalPositionPercent = clamp(overlay.verticalPositionPercent, halfHeight + edgeMarginPercent, 100 - halfHeight - edgeMarginPercent);
    if (Math.abs(horizontalPositionPercent - overlay.horizontalPositionPercent) > 0.01 || Math.abs(verticalPositionPercent - overlay.verticalPositionPercent) > 0.01) onChange?.({ horizontalPositionPercent, verticalPositionPercent, widthPercent: overlay.widthPercent });
  }, [onChange, overlay.horizontalPositionPercent, overlay.text, overlay.verticalPositionPercent, overlay.widthPercent]);
  if (!isVisible || !overlay.text.trim()) return null;
  function beginDrag(event: PointerEvent<HTMLElement>, mode: DragMode) {
    const block = blockRef.current; const container = overlayRef.current; if (!block || !container) return;
    event.preventDefault(); event.stopPropagation(); onSelect?.();
    const blockBounds = block.getBoundingClientRect(); const containerBounds = container.getBoundingClientRect();
    dragStateRef.current = { blockHeightPercent: (blockBounds.height / containerBounds.height) * 100, horizontalPositionPercent: overlay.horizontalPositionPercent, mode, verticalPositionPercent: overlay.verticalPositionPercent, widthPercent: overlay.widthPercent };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function updateDrag(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current; const bounds = overlayRef.current?.getBoundingClientRect(); if (!dragState || !bounds) return;
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * 100; const pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;
    const left = dragState.horizontalPositionPercent - dragState.widthPercent / 2; const right = dragState.horizontalPositionPercent + dragState.widthPercent / 2;
    if (dragState.mode === "resize-left") { const nextLeft = clamp(pointerX, Math.max(edgeMarginPercent, right - maximumWidthPercent), right - minimumWidthPercent); const widthPercent = right - nextLeft; onChange?.({ horizontalPositionPercent: nextLeft + widthPercent / 2, verticalPositionPercent: dragState.verticalPositionPercent, widthPercent }); return; }
    if (dragState.mode === "resize-right") { const nextRight = clamp(pointerX, left + minimumWidthPercent, Math.min(100 - edgeMarginPercent, left + maximumWidthPercent)); const widthPercent = nextRight - left; onChange?.({ horizontalPositionPercent: left + widthPercent / 2, verticalPositionPercent: dragState.verticalPositionPercent, widthPercent }); return; }
    onChange?.({ horizontalPositionPercent: clamp(pointerX, dragState.widthPercent / 2 + edgeMarginPercent, 100 - dragState.widthPercent / 2 - edgeMarginPercent), verticalPositionPercent: clamp(pointerY, dragState.blockHeightPercent / 2 + edgeMarginPercent, 100 - dragState.blockHeightPercent / 2 - edgeMarginPercent), widthPercent: dragState.widthPercent });
  }
  return <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 z-10", className)} ref={overlayRef} style={{ containerType: "inline-size" }}><div className={cn("group pointer-events-auto absolute box-border cursor-grab touch-none select-none px-2 py-1 text-center font-extrabold leading-tight shadow-sm outline outline-2 outline-transparent active:cursor-grabbing", fontClasses[overlay.fontFamily], isSelected && "outline-cyan-300")} onPointerDown={(event) => beginDrag(event, "move")} onPointerMove={updateDrag} onPointerUp={() => { dragStateRef.current = undefined; }} ref={blockRef} style={{ backgroundColor: overlay.backgroundColor, color: overlay.color, fontSize: `${overlay.fontSizePercent}cqw`, left: `${overlay.horizontalPositionPercent}%`, top: `${overlay.verticalPositionPercent}%`, transform: "translate(-50%, -50%)", userSelect: "none", WebkitUserSelect: "none", width: `${overlay.widthPercent}%` } as CSSProperties}>{overlay.text}{isSelected ? <><span aria-hidden="true" className="absolute inset-y-0 left-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginDrag(event, "resize-left")} /><span aria-hidden="true" className="absolute inset-y-0 right-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginDrag(event, "resize-right")} /></> : null}</div></div>;
}
