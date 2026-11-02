import type { PlaybackSettings } from "@/features/project/playback-settings";
import { getKeptSeconds } from "@/features/project/playback-settings";
import { formatTime } from "@/lib/format-time";

interface EditorTimelineProps {
  currentTime: number;
  onSeek(timeSeconds: number): void;
  playback: PlaybackSettings;
  totalSeconds: number;
}

export function EditorTimeline({ currentTime, onSeek, playback, totalSeconds }: EditorTimelineProps) {
  const toPercent = (seconds: number) => (seconds / totalSeconds) * 100;
  const start = toPercent(playback.trimStartSeconds);
  const end = toPercent(playback.trimEndSeconds);
  const cutCount = playback.removedRanges.length;

  return (
    <section className="shrink-0 border-t border-white/10 bg-[#0c1017] px-5 py-4">
      <div className="mb-2 flex justify-between text-xs text-slate-500"><span>00:00</span><span>{formatTime(totalSeconds / 2)}</span><span>{formatTime(totalSeconds)}</span></div>
      <button
        aria-label="Seek video timeline"
        className="relative h-12 w-full cursor-pointer overflow-hidden rounded-lg bg-slate-800 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          onSeek(((event.clientX - bounds.left) / bounds.width) * totalSeconds);
        }}
        type="button"
      >
        <span className="absolute inset-y-1 rounded-md border border-cyan-300 bg-cyan-300/15" style={{ left: `${start}%`, right: `${100 - end}%` }} />
        {playback.removedRanges.map((range) => <span className="absolute inset-y-1 bg-slate-950/85" key={range.startSeconds} style={{ left: `${toPercent(range.startSeconds)}%`, width: `${toPercent(range.endSeconds - range.startSeconds)}%` }} />)}
        <span className="absolute inset-y-0 w-0.5 bg-cyan-300" style={{ left: `${toPercent(currentTime)}%` }} />
      </button>
      <div className="mt-2 flex justify-between text-xs text-slate-500"><span>V1 · Video{cutCount > 0 ? ` · ${cutCount} ${cutCount === 1 ? "cut" : "cuts"} (dark sections are skipped)` : ""}</span><span>{formatTime(getKeptSeconds(playback))} selected</span></div>
    </section>
  );
}
