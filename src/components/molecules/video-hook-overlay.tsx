import { useLayoutEffect, useRef, type PointerEvent } from "react";

import type { HookSettings } from "@/features/project/hook-settings";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type HookLayoutChange = Pick<HookSettings, "horizontalPositionPercent" | "verticalPositionPercent" | "widthPercent">;
type DragMode = "move" | "resize-left" | "resize-right";

interface DragState extends HookLayoutChange {
  blockHeightPercent: number;
  mode: DragMode;
}

interface VideoHookOverlayProps {
  className?: string;
  hook: HookSettings;
  isVisible: boolean;
  onChange?(change: HookLayoutChange): void;
  showPlaceholder?: boolean;
}

const edgeMarginPercent = 1;
const minimumWidthPercent = 20;
const maximumWidthPercent = 86;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function VideoHookOverlay({ className, hook, isVisible, onChange, showPlaceholder = false }: VideoHookOverlayProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | undefined>(undefined);
  const text = hook.text.trim() || (showPlaceholder ? "Your opening hook" : "");

  useLayoutEffect(() => {
    const block = blockRef.current;
    const overlay = overlayRef.current;
    if (!block || !overlay) return;

    const blockBounds = block.getBoundingClientRect();
    const overlayBounds = overlay.getBoundingClientRect();
    const halfWidth = (blockBounds.width / overlayBounds.width) * 50;
    const halfHeight = (blockBounds.height / overlayBounds.height) * 50;
    const horizontalPositionPercent = clamp(hook.horizontalPositionPercent, halfWidth + edgeMarginPercent, 100 - halfWidth - edgeMarginPercent);
    const verticalPositionPercent = clamp(hook.verticalPositionPercent, halfHeight + edgeMarginPercent, 100 - halfHeight - edgeMarginPercent);

    if (Math.abs(horizontalPositionPercent - hook.horizontalPositionPercent) > 0.01 || Math.abs(verticalPositionPercent - hook.verticalPositionPercent) > 0.01) {
      onChange?.({ horizontalPositionPercent, verticalPositionPercent, widthPercent: hook.widthPercent });
    }
  }, [hook.horizontalPositionPercent, hook.verticalPositionPercent, hook.widthPercent, onChange, text]);

  if (!hook.enabled || !text || !isVisible) return null;

  function beginDrag(event: PointerEvent<HTMLElement>, mode: DragMode) {
    const block = blockRef.current;
    const overlay = overlayRef.current;
    if (!block || !overlay) return;

    event.preventDefault();
    event.stopPropagation();
    const blockBounds = block.getBoundingClientRect();
    const overlayBounds = overlay.getBoundingClientRect();
    dragStateRef.current = {
      blockHeightPercent: (blockBounds.height / overlayBounds.height) * 100,
      horizontalPositionPercent: hook.horizontalPositionPercent,
      mode,
      verticalPositionPercent: hook.verticalPositionPercent,
      widthPercent: hook.widthPercent,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updateDrag(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    const overlayBounds = overlayRef.current?.getBoundingClientRect();
    if (!dragState || !overlayBounds) return;

    const pointerX = ((event.clientX - overlayBounds.left) / overlayBounds.width) * 100;
    const pointerY = ((event.clientY - overlayBounds.top) / overlayBounds.height) * 100;
    const left = dragState.horizontalPositionPercent - dragState.widthPercent / 2;
    const right = dragState.horizontalPositionPercent + dragState.widthPercent / 2;

    if (dragState.mode === "resize-left") {
      const nextLeft = clamp(pointerX, Math.max(edgeMarginPercent, right - maximumWidthPercent), right - minimumWidthPercent);
      const widthPercent = right - nextLeft;
      onChange?.({ horizontalPositionPercent: nextLeft + widthPercent / 2, verticalPositionPercent: dragState.verticalPositionPercent, widthPercent });
      return;
    }

    if (dragState.mode === "resize-right") {
      const nextRight = clamp(pointerX, left + minimumWidthPercent, Math.min(100 - edgeMarginPercent, left + maximumWidthPercent));
      const widthPercent = nextRight - left;
      onChange?.({ horizontalPositionPercent: left + widthPercent / 2, verticalPositionPercent: dragState.verticalPositionPercent, widthPercent });
      return;
    }

    const horizontalPositionPercent = clamp(pointerX, dragState.widthPercent / 2 + edgeMarginPercent, 100 - dragState.widthPercent / 2 - edgeMarginPercent);
    const verticalPositionPercent = clamp(pointerY, dragState.blockHeightPercent / 2 + edgeMarginPercent, 100 - dragState.blockHeightPercent / 2 - edgeMarginPercent);
    onChange?.({ horizontalPositionPercent, verticalPositionPercent, widthPercent: dragState.widthPercent });
  }

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 z-10", className)} ref={overlayRef} style={{ containerType: "inline-size" }}>
      <div
        className={cn("group pointer-events-auto absolute box-border cursor-grab touch-none select-none bg-black px-2 py-1 text-center font-extrabold leading-tight text-white shadow-sm active:cursor-grabbing", !hook.text.trim() && "italic text-white/80")}
        onPointerDown={(event) => beginDrag(event, "move")}
        onPointerMove={updateDrag}
        onPointerUp={() => { dragStateRef.current = undefined; }}
        ref={blockRef}
        style={{ backgroundColor: hook.backgroundColor, fontSize: `${hook.fontSizePercent}cqw`, left: `${hook.horizontalPositionPercent}%`, top: `${hook.verticalPositionPercent}%`, transform: "translate(-50%, -50%)", userSelect: "none", WebkitUserSelect: "none", width: `${hook.widthPercent}%` } as CSSProperties}
      >
        {text}
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-2 cursor-ew-resize opacity-0 transition-opacity group-hover:opacity-100" onPointerDown={(event) => beginDrag(event, "resize-left")} />
        <span aria-hidden="true" className="absolute inset-y-0 right-0 w-2 cursor-ew-resize opacity-0 transition-opacity group-hover:opacity-100" onPointerDown={(event) => beginDrag(event, "resize-right")} />
      </div>
    </div>
  );
}
