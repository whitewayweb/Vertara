import { cn } from "@/lib/utils";
import { PlaybackVideo } from "@/components/atoms/playback-video";
import type { PlaybackSettings } from "@/features/project/playback-settings";

interface CanvasVideoPreviewProps {
  className?: string;
  playback: PlaybackSettings;
  sourceUrl: string;
}

export function CanvasVideoPreview({ className, playback, sourceUrl }: CanvasVideoPreviewProps) {
  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <PlaybackVideo
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
        playback={playback}
        sourceUrl={sourceUrl}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/30" />
      <PlaybackVideo className="relative h-full w-full object-contain" playback={playback} sourceUrl={sourceUrl} />
    </div>
  );
}
