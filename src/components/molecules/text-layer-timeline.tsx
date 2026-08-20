import type { TextOverlay } from "@/features/project/text-overlays";
import { cn } from "@/lib/utils";

interface TextLayerTimelineProps {
  onSelect(id: string): void;
  overlays: TextOverlay[];
  selectedOverlayId?: string;
  totalSeconds: number;
}

export function TextLayerTimeline({ onSelect, overlays, selectedOverlayId, totalSeconds }: TextLayerTimelineProps) {
  if (overlays.length === 0) return null;
  return <section aria-label="Text layer timing" className="shrink-0 border-t border-white/10 bg-[#0c1017] px-5 py-3"><div className="mb-2 flex justify-between text-xs text-slate-500"><span>Text timing</span><span>{totalSeconds.toFixed(1)}s</span></div><div className="space-y-1.5">{overlays.map((overlay, index) => { const left = (overlay.startSeconds / totalSeconds) * 100; const width = Math.min((overlay.durationSeconds / totalSeconds) * 100, 100 - left); return <button aria-pressed={overlay.id === selectedOverlayId} className="relative h-7 w-full rounded bg-white/5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" key={overlay.id} onClick={() => onSelect(overlay.id)} type="button"><span className={cn("absolute inset-y-0.5 rounded border px-2 py-1 text-[0.65rem] leading-none", overlay.id === selectedOverlayId ? "border-cyan-300 bg-cyan-300/20 text-cyan-50" : "border-white/10 bg-slate-700/60 text-slate-300")} style={{ left: `${left}%`, width: `${width}%` }}>{overlay.text.trim() || `Text ${index + 1}`}</span></button>; })}</div></section>;
}
