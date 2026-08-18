import type { HookPosition, HookSettings } from "@/features/project/hook-settings";
import { cn } from "@/lib/utils";

interface VideoHookOverlayProps {
  className?: string;
  hook: HookSettings;
  isVisible: boolean;
}

const positionClasses: Record<HookPosition, string> = {
  top: "top-[8%]",
  center: "top-1/2 -translate-y-1/2",
  bottom: "bottom-[8%]",
};

export function VideoHookOverlay({ className, hook, isVisible }: VideoHookOverlayProps) {
  if (!hook.enabled || !hook.text.trim() || !isVisible) return null;

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-[7%] z-10 text-center", positionClasses[hook.position], className)}>
      <span className="bg-black/80 px-2 py-1 text-lg font-extrabold leading-tight text-white shadow-sm sm:text-xl">
        {hook.text}
      </span>
    </div>
  );
}
