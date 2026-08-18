import type { HookPosition, HookSettings } from "@/features/project/hook-settings";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface VideoHookOverlayProps {
  className?: string;
  hook: HookSettings;
  isVisible: boolean;
  showPlaceholder?: boolean;
}

const positionClasses: Record<HookPosition, string> = {
  top: "top-[8%]",
  center: "top-1/2 -translate-y-1/2",
  bottom: "bottom-[8%]",
};

export function VideoHookOverlay({ className, hook, isVisible, showPlaceholder = false }: VideoHookOverlayProps) {
  const text = hook.text.trim() || (showPlaceholder ? "Your opening hook" : "");
  if (!hook.enabled || !text || !isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-[7%] z-10 text-center", positionClasses[hook.position], className)}
      style={{ containerType: "inline-size" }}
    >
      <span
        className={cn("px-2 py-1 font-extrabold leading-tight text-white shadow-sm", !hook.text.trim() && "italic text-white/80")}
        style={{ backgroundColor: hook.backgroundColor, fontSize: `${hook.fontSizePercent}cqw` } as CSSProperties}
      >
        {text}
      </span>
    </div>
  );
}
