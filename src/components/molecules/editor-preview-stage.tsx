import { useState } from "react";

import { PlaybackVideo } from "@/components/atoms/playback-video";
import { CanvasVideoPreview } from "@/components/molecules/canvas-video-preview";
import { PosterVideoPreview } from "@/components/molecules/poster-video-preview";
import { VideoHookOverlay } from "@/components/molecules/video-hook-overlay";
import type { ExportLayoutMode } from "@/features/export/local-mp4-exporter";
import { isTextOverlayVisible, type TextOverlay } from "@/features/project/text-overlays";
import { getOutputElapsedSeconds, type PlaybackSettings } from "@/features/project/playback-settings";
import type { CanvasLayout } from "@/features/render/canvas-layout";
import { getFocusObjectPosition, type FocusLayout } from "@/features/render/focus-layout";
import type { PosterLayout } from "@/features/render/poster-layout";
import { cn } from "@/lib/utils";

interface EditorPreviewStageProps {
  canvasLayout: CanvasLayout;
  className: string;
  focusLayout: FocusLayout;
  overlays: TextOverlay[];
  isPlaying: boolean;
  mode: ExportLayoutMode;
  onOverlayLayoutChange(id: string, change: Pick<TextOverlay, "horizontalPositionPercent" | "verticalPositionPercent" | "widthPercent">): void;
  onOverlaySelect(id: string): void;
  onPlaybackTimeChange(timeSeconds: number): void;
  playback: PlaybackSettings;
  posterLayout: PosterLayout;
  seekRequest: { id: number; timeSeconds: number };
  selectedOverlayId?: string;
  sourceUrl: string;
}

export function EditorPreviewStage({ canvasLayout, className, focusLayout, isPlaying, mode, onOverlayLayoutChange, onOverlaySelect, onPlaybackTimeChange, overlays, playback, posterLayout, seekRequest, selectedOverlayId, sourceUrl }: EditorPreviewStageProps) {
  const [focusCurrentTime, setFocusCurrentTime] = useState(playback.trimStartSeconds);

  if (mode === "poster") {
    return <PosterVideoPreview className={className} headline={posterLayout.headline} isPlaying={isPlaying} onOverlayLayoutChange={onOverlayLayoutChange} onOverlaySelect={onOverlaySelect} onPlaybackTimeChange={onPlaybackTimeChange} overlays={overlays} playback={playback} seekRequest={seekRequest} selectedOverlayId={selectedOverlayId} sourceUrl={sourceUrl} subline={posterLayout.subline} />;
  }

  if (mode === "focus") {
    return <div className={cn("relative overflow-hidden bg-black", className)}><PlaybackVideo className="size-full object-cover" isPlaying={isPlaying} onPlaybackTimeChange={(timeSeconds) => { setFocusCurrentTime(timeSeconds); onPlaybackTimeChange(timeSeconds); }} playback={playback} seekRequest={seekRequest} sourceUrl={sourceUrl} style={{ objectPosition: getFocusObjectPosition(focusLayout), transform: `scale(${focusLayout.zoom})` }} />{overlays.map((overlay) => <VideoHookOverlay isSelected={overlay.id === selectedOverlayId} isVisible={isTextOverlayVisible(overlay, getOutputElapsedSeconds(focusCurrentTime - playback.trimStartSeconds, playback))} key={overlay.id} onChange={(change) => onOverlayLayoutChange(overlay.id, change)} onSelect={() => onOverlaySelect(overlay.id)} overlay={overlay} />)}</div>;
  }

  return <CanvasVideoPreview canvasLayout={canvasLayout} className={className} isPlaying={isPlaying} onOverlayLayoutChange={onOverlayLayoutChange} onOverlaySelect={onOverlaySelect} onPlaybackTimeChange={onPlaybackTimeChange} overlays={overlays} playback={playback} seekRequest={seekRequest} selectedOverlayId={selectedOverlayId} sourceUrl={sourceUrl} />;
}
