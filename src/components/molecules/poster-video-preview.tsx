import { useState } from "react";

import { VideoHookOverlay } from "@/components/molecules/video-hook-overlay";
import { cn } from "@/lib/utils";
import { PlaybackVideo } from "@/components/atoms/playback-video";
import { isTextOverlayVisible, type TextOverlay } from "@/features/project/text-overlays";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import { getOutputElapsedSeconds } from "@/features/project/playback-settings";
import { getVideoAdjustmentsFilter, type VideoAdjustments } from "@/features/render/video-adjustments";

interface PosterVideoPreviewProps {
  className?: string;
  headline: string;
  overlays: TextOverlay[];
  isPlaying?: boolean;
  onOverlayLayoutChange?(id: string, change: Pick<TextOverlay, "horizontalPositionPercent" | "verticalPositionPercent" | "widthPercent">): void;
  onOverlaySelect?(id: string): void;
  onPlaybackTimeChange?(timeSeconds: number): void;
  playback: PlaybackSettings;
  selectedOverlayId?: string;
  seekRequest?: { id: number; timeSeconds: number };
  sourceUrl: string;
  subline: string;
  videoAdjustments: VideoAdjustments;
}

export function PosterVideoPreview({ className, headline, isPlaying, onOverlayLayoutChange, onOverlaySelect, onPlaybackTimeChange, overlays, playback, seekRequest, selectedOverlayId, sourceUrl, subline, videoAdjustments }: PosterVideoPreviewProps) {
  const [currentTime, setCurrentTime] = useState(playback.trimStartSeconds);

  return (
    <div className={cn("relative flex h-full flex-col gap-3 overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-400 p-3 text-white", className)}>
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-white/70">Vertara</p>
        <h3 className="mt-1 text-lg font-semibold leading-tight">{headline || "Your story"}</h3>
        {subline ? <p className="mt-1 text-xs text-white/80">{subline}</p> : null}
      </div>
      <PlaybackVideo
        className="min-h-0 flex-1 rounded-md object-contain shadow-lg"
        isPlaying={isPlaying}
        onPlaybackTimeChange={(timeSeconds) => { setCurrentTime(timeSeconds); onPlaybackTimeChange?.(timeSeconds); }}
        playback={playback}
        seekRequest={seekRequest}
        sourceUrl={sourceUrl}
        style={{ filter: getVideoAdjustmentsFilter(videoAdjustments) }}
      />
      {overlays.map((overlay) => <VideoHookOverlay isSelected={overlay.id === selectedOverlayId} isVisible={isTextOverlayVisible(overlay, getOutputElapsedSeconds(currentTime - playback.trimStartSeconds, playback))} key={overlay.id} onChange={(change) => onOverlayLayoutChange?.(overlay.id, change)} onSelect={() => onOverlaySelect?.(overlay.id)} overlay={overlay} />)}
    </div>
  );
}
