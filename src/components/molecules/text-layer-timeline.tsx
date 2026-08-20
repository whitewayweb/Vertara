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
  return <section aria-label="Text layer timing" className="shrink-0 border-t border-white/10 bg-[#0c1017] px-5 py-3"><div className="mb-2 flex justify-between text-xs text-slate-500"><span>Text timing</span><span>{totalSeconds.toFixed(1)}s</span></div><div className="space-y-1.5">{overlays.map((overlay, index) => { const left = (overlay.startSeconds / totalSeconds) * 100; const width = Math.min((overlay.durationSeconds / totalSeconds) * 100, 100 - left); return <div className="flex items-center gap-2" key={overlay.id}><button aria-pressed={overlay.id === selectedOverlayId} className={cn("w-32 shrink-0 truncate rounded px-2 py-1 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300", overlay.id === selectedOverlayId ? "bg-cyan-300/10 text-cyan-50" : "bg-white/5 text-slate-300")} onClick={() => onSelect(overlay.id)} type="button">{overlay.text.trim() || `Text ${index + 1}`}</button><button aria-label={`Select timing for ${overlay.text.trim() || `text ${index + 1}`}`} aria-pressed={overlay.id === selectedOverlayId} className="relative h-7 min-w-0 flex-1 rounded bg-white/5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" onClick={() => onSelect(overlay.id)} type="button"><span className={cn("absolute inset-y-0.5 min-w-1 rounded border", overlay.id === selectedOverlayId ? "border-cyan-300 bg-cyan-300/20" : "border-white/10 bg-slate-700/60")} style={{ left: `${left}%`, width: `${width}%` }} /></button></div>; })}</div></section>;
}
