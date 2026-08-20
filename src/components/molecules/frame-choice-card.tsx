import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FrameChoiceCardProps {
  children: ReactNode;
  description: string;
  onSelect(): void;
  selected: boolean;
  title: string;
}

export function FrameChoiceCard({ children, description, onSelect, selected, title }: FrameChoiceCardProps) {
  return <Button aria-pressed={selected} className={cn("h-auto min-w-0 flex-col items-stretch overflow-hidden rounded-xl border border-white/10 bg-black/20 p-0 text-left hover:bg-white/5", selected && "border-cyan-300 bg-cyan-300/10 text-cyan-50")} onClick={onSelect} variant="ghost">
    <div aria-hidden="true" className="pointer-events-none relative aspect-[9/16] overflow-hidden bg-slate-950">
      {children}
      <span className={cn("absolute right-2 top-2 size-2 rounded-full border border-white/60 bg-black/30", selected && "border-cyan-200 bg-cyan-300 shadow-[0_0_0_3px_rgba(34,211,238,0.18)]")} />
    </div>
    <span className="block p-3"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs font-normal leading-4 text-slate-400">{description}</span></span>
  </Button>;
}
