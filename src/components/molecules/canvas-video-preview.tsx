import { useState } from "react";

import { VideoHookOverlay } from "@/components/molecules/video-hook-overlay";
import { cn } from "@/lib/utils";
import { PlaybackVideo } from "@/components/atoms/playback-video";
import { isTextOverlayVisible, type TextOverlay } from "@/features/project/text-overlays";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import { getOutputElapsedSeconds } from "@/features/project/playback-settings";
import { defaultCanvasLayout, type CanvasLayout } from "@/features/render/canvas-layout";

interface CanvasVideoPreviewProps {
  canvasLayout?: CanvasLayout;
  className?: string;
  overlays: TextOverlay[];
  isPlaying?: boolean;
  onOverlayLayoutChange?(id: string, change: Pick<TextOverlay, "horizontalPositionPercent" | "verticalPositionPercent" | "widthPercent">): void;
  onOverlaySelect?(id: string): void;
  onPlaybackTimeChange?(timeSeconds: number): void;
  playback: PlaybackSettings;
  selectedOverlayId?: string;
  seekRequest?: { id: number; timeSeconds: number };
  sourceUrl: string;
}

export function CanvasVideoPreview({ canvasLayout = defaultCanvasLayout, className, isPlaying, onOverlayLayoutChange, onOverlaySelect, onPlaybackTimeChange, overlays, playback, seekRequest, selectedOverlayId, sourceUrl }: CanvasVideoPreviewProps) {
  const [currentTime, setCurrentTime] = useState(playback.trimStartSeconds);

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <PlaybackVideo
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover"
        isPlaying={isPlaying}
        playback={playback}
        seekRequest={seekRequest}
        sourceUrl={sourceUrl}
        style={{ filter: `blur(${canvasLayout.backdropBlurPixels}px)`, opacity: canvasLayout.backdropOpacity }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: canvasLayout.dimOpacity }} />
      <PlaybackVideo
        className="relative h-full w-full object-contain"
        isPlaying={isPlaying}
        onPlaybackTimeChange={(timeSeconds) => { setCurrentTime(timeSeconds); onPlaybackTimeChange?.(timeSeconds); }}
        playback={playback}
        seekRequest={seekRequest}
        sourceUrl={sourceUrl}
      />
      {overlays.map((overlay) => <VideoHookOverlay isSelected={overlay.id === selectedOverlayId} isVisible={isTextOverlayVisible(overlay, getOutputElapsedSeconds(currentTime - playback.trimStartSeconds, playback))} key={overlay.id} onChange={(change) => onOverlayLayoutChange?.(overlay.id, change)} onSelect={() => onOverlaySelect?.(overlay.id)} overlay={overlay} />)}
    </div>
  );
}
