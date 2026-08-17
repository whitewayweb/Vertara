import { cn } from "@/lib/utils";
import { PlaybackVideo } from "@/components/atoms/playback-video";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import { defaultCanvasLayout, type CanvasLayout } from "@/features/render/canvas-layout";

interface CanvasVideoPreviewProps {
  canvasLayout?: CanvasLayout;
  className?: string;
  playback: PlaybackSettings;
  sourceUrl: string;
}

export function CanvasVideoPreview({ canvasLayout = defaultCanvasLayout, className, playback, sourceUrl }: CanvasVideoPreviewProps) {
  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <PlaybackVideo
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover"
        playback={playback}
        sourceUrl={sourceUrl}
        style={{ filter: `blur(${canvasLayout.backdropBlurPixels}px)`, opacity: canvasLayout.backdropOpacity }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: canvasLayout.dimOpacity }} />
      <PlaybackVideo className="relative h-full w-full object-contain" playback={playback} sourceUrl={sourceUrl} />
    </div>
  );
}
