import { useState } from "react";

import { PlaybackVideo } from "@/components/atoms/playback-video";
import { CanvasVideoPreview } from "@/components/molecules/canvas-video-preview";
import { PosterVideoPreview } from "@/components/molecules/poster-video-preview";
import { VideoHookOverlay } from "@/components/molecules/video-hook-overlay";
import type { ExportLayoutMode } from "@/features/export/local-mp4-exporter";
import type { HookSettings } from "@/features/project/hook-settings";
import { getOutputElapsedSeconds, type PlaybackSettings } from "@/features/project/playback-settings";
import type { CanvasLayout } from "@/features/render/canvas-layout";
import { getFocusObjectPosition, type FocusLayout } from "@/features/render/focus-layout";
import type { PosterLayout } from "@/features/render/poster-layout";
import { cn } from "@/lib/utils";

interface EditorPreviewStageProps {
  canvasLayout: CanvasLayout;
  className: string;
  focusLayout: FocusLayout;
  hook: HookSettings;
  isPlaying: boolean;
  mode: ExportLayoutMode;
  onHookLayoutChange(change: Pick<HookSettings, "horizontalPositionPercent" | "verticalPositionPercent" | "widthPercent">): void;
  onPlaybackTimeChange(timeSeconds: number): void;
  playback: PlaybackSettings;
  posterLayout: PosterLayout;
  seekRequest: { id: number; timeSeconds: number };
  sourceUrl: string;
}

export function EditorPreviewStage({ canvasLayout, className, focusLayout, hook, isPlaying, mode, onHookLayoutChange, onPlaybackTimeChange, playback, posterLayout, seekRequest, sourceUrl }: EditorPreviewStageProps) {
  const [focusCurrentTime, setFocusCurrentTime] = useState(playback.trimStartSeconds);

  if (mode === "poster") {
    return <PosterVideoPreview className={className} headline={posterLayout.headline} hook={hook} isPlaying={isPlaying} onHookLayoutChange={onHookLayoutChange} onPlaybackTimeChange={onPlaybackTimeChange} playback={playback} seekRequest={seekRequest} sourceUrl={sourceUrl} subline={posterLayout.subline} />;
  }

  if (mode === "focus") {
    return <div className={cn("relative overflow-hidden bg-black", className)}><PlaybackVideo className="size-full object-cover" isPlaying={isPlaying} onPlaybackTimeChange={(timeSeconds) => { setFocusCurrentTime(timeSeconds); onPlaybackTimeChange(timeSeconds); }} playback={playback} seekRequest={seekRequest} sourceUrl={sourceUrl} style={{ objectPosition: getFocusObjectPosition(focusLayout), transform: `scale(${focusLayout.zoom})` }} /><VideoHookOverlay hook={hook} isVisible={getOutputElapsedSeconds(focusCurrentTime - playback.trimStartSeconds, playback) < hook.durationSeconds} showPlaceholder onChange={onHookLayoutChange} /></div>;
  }

  return <CanvasVideoPreview canvasLayout={canvasLayout} className={className} hook={hook} isPlaying={isPlaying} onHookLayoutChange={onHookLayoutChange} onPlaybackTimeChange={onPlaybackTimeChange} playback={playback} seekRequest={seekRequest} sourceUrl={sourceUrl} />;
}
