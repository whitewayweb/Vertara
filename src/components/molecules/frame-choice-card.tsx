import { Button } from "@/components/ui/button";
import type { ExportLayoutMode } from "@/features/export/local-mp4-exporter";
import { cn } from "@/lib/utils";

interface FrameChoiceCardProps {
  description: string;
  mode: ExportLayoutMode;
  onSelect(): void;
  selected: boolean;
  sourceUrl: string;
  title: string;
}

export function FrameChoiceCard({ description, mode, onSelect, selected, sourceUrl, title }: FrameChoiceCardProps) {
  return <Button aria-pressed={selected} className={cn("h-auto min-w-0 flex-col items-stretch overflow-hidden rounded-xl border border-white/10 bg-black/20 p-0 text-left hover:bg-white/5", selected && "border-cyan-300 bg-cyan-300/10 text-cyan-50")} onClick={onSelect} variant="ghost">
    <div aria-hidden="true" className="relative aspect-[16/9] overflow-hidden bg-slate-950">
      {mode === "canvas" ? <><video autoPlay className="absolute inset-0 size-full scale-110 object-cover opacity-45 blur-md" loop muted playsInline preload="metadata" src={sourceUrl} /><video autoPlay className="relative size-full object-contain" loop muted playsInline preload="metadata" src={sourceUrl} /></> : null}
      {mode === "focus" ? <video autoPlay className="size-full object-cover" loop muted playsInline preload="metadata" src={sourceUrl} /> : null}
      {mode === "poster" ? <><video autoPlay className="size-full object-cover opacity-75" loop muted playsInline preload="metadata" src={sourceUrl} /><span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" /><span className="absolute inset-x-3 bottom-3 font-sans text-base font-black leading-none tracking-tight text-white">YOUR<br />STORY</span></> : null}
      <span className={cn("absolute right-2 top-2 size-2 rounded-full border border-white/60 bg-black/30", selected && "border-cyan-200 bg-cyan-300 shadow-[0_0_0_3px_rgba(34,211,238,0.18)]")} />
    </div>
    <span className="block p-3"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs font-normal leading-4 text-slate-400">{description}</span></span>
  </Button>;
}
