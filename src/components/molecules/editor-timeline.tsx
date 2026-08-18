import { formatTime } from "@/lib/format-time";

interface EditorTimelineProps {
  currentTime: number;
  endSeconds: number;
  onSeek(timeSeconds: number): void;
  startSeconds: number;
  totalSeconds: number;
}

export function EditorTimeline({ currentTime, endSeconds, onSeek, startSeconds, totalSeconds }: EditorTimelineProps) {
  const start = (startSeconds / totalSeconds) * 100;
  const end = (endSeconds / totalSeconds) * 100;
  const playhead = (currentTime / totalSeconds) * 100;

  return (
    <section className="shrink-0 border-t border-white/10 bg-[#0c1017] px-5 py-4">
      <div className="mb-2 flex justify-between text-xs text-slate-500"><span>00:00</span><span>{formatTime(totalSeconds / 2)}</span><span>{formatTime(totalSeconds)}</span></div>
      <button
        aria-label="Seek video timeline"
        className="relative h-12 w-full cursor-pointer rounded-lg bg-slate-800 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          onSeek(((event.clientX - bounds.left) / bounds.width) * totalSeconds);
        }}
        type="button"
      >
        <span className="absolute inset-y-1 rounded-md border border-cyan-300 bg-cyan-300/15" style={{ left: `${start}%`, right: `${100 - end}%` }} />
        <span className="absolute inset-y-0 w-0.5 bg-cyan-300" style={{ left: `${playhead}%` }} />
      </button>
      <div className="mt-2 flex justify-between text-xs text-slate-500"><span>V1 · Video</span><span>{formatTime(Math.max(0, endSeconds - startSeconds))} selected</span></div>
    </section>
  );
}
