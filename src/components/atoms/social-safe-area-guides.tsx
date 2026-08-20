import type { OutputSettings } from "@/features/project/output-settings";

interface SocialSafeAreaGuidesProps {
  output: Pick<OutputSettings, "height" | "width">;
  visible: boolean;
}

interface SafeAreaInsets {
  bottom: number;
  horizontal: number;
  top: number;
}

export function getSocialSafeAreaInsets(output: Pick<OutputSettings, "height" | "width">): SafeAreaInsets {
  const heightToWidth = output.height / output.width;
  if (heightToWidth >= 1.5) return { bottom: 12, horizontal: 4, top: 5 };
  if (heightToWidth > 1) return { bottom: 8, horizontal: 4, top: 4 };
  return { bottom: 5, horizontal: 3, top: 5 };
}

export function SocialSafeAreaGuides({ output, visible }: SocialSafeAreaGuidesProps) {
  if (!visible) return null;
  const insets = getSocialSafeAreaInsets(output);
  return <div aria-hidden="true" className="pointer-events-none absolute z-20 rounded border border-dashed border-white/65 shadow-[0_0_0_9999px_rgba(0,0,0,0.04)]" style={{ bottom: `${insets.bottom}%`, left: `${insets.horizontal}%`, right: `${insets.horizontal}%`, top: `${insets.top}%` }}><span className="absolute -top-5 left-0 rounded bg-black/45 px-1.5 py-0.5 text-[0.55rem] font-medium uppercase tracking-wider text-white/75">Safe area</span></div>;
}
