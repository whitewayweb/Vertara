import { useState } from "react";

import { VideoHookOverlay } from "@/components/molecules/video-hook-overlay";
import { cn } from "@/lib/utils";
import { PlaybackVideo } from "@/components/atoms/playback-video";
import type { HookSettings } from "@/features/project/hook-settings";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import { defaultCanvasLayout, type CanvasLayout } from "@/features/render/canvas-layout";

interface CanvasVideoPreviewProps {
  canvasLayout?: CanvasLayout;
  className?: string;
  hook?: HookSettings;
  playback: PlaybackSettings;
  sourceUrl: string;
}

export function CanvasVideoPreview({ canvasLayout = defaultCanvasLayout, className, hook, playback, sourceUrl }: CanvasVideoPreviewProps) {
  const [currentTime, setCurrentTime] = useState(playback.trimStartSeconds);

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
      <PlaybackVideo
        className="relative h-full w-full object-contain"
        onPlaybackTimeChange={setCurrentTime}
        playback={playback}
        sourceUrl={sourceUrl}
      />
      {hook ? <VideoHookOverlay hook={hook} isVisible={currentTime - playback.trimStartSeconds < hook.durationSeconds} showPlaceholder /> : null}
    </div>
  );
}
