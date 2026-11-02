import { useMemo } from "react";

import { PlaybackVideo } from "@/components/atoms/playback-video";
import { SocialSafeAreaGuides } from "@/components/atoms/social-safe-area-guides";
import { CanvasVideoPreview } from "@/components/molecules/canvas-video-preview";
import { CaptionOverlay } from "@/components/molecules/caption-overlay";
import { PosterVideoPreview } from "@/components/molecules/poster-video-preview";
import { VideoHookOverlay } from "@/components/molecules/video-hook-overlay";
import { createCaptionLines } from "@/features/captions/captions";
import { getOutputElapsedSeconds } from "@/features/project/playback-settings";
import { isTextOverlayVisible, type TextOverlay } from "@/features/project/text-overlays";
import { getFocusObjectPosition } from "@/features/render/focus-layout";
import { getFocusPanAt } from "@/features/render/focus-track";
import type { ProjectRenderState } from "@/features/render/project-render";
import { getVideoAdjustmentsFilter } from "@/features/render/video-adjustments";
import { cn } from "@/lib/utils";

interface EditorPreviewStageProps {
  className: string;
  cleanupAudio: boolean;
  currentTime: number;
  isPlaying: boolean;
  onOverlayLayoutChange(id: string, change: Pick<TextOverlay, "horizontalPositionPercent" | "verticalPositionPercent" | "widthPercent">): void;
  onOverlaySelect(id: string): void;
  onPlaybackTimeChange?(timeSeconds: number): void;
  project: ProjectRenderState;
  seekRequest: { id: number; timeSeconds: number };
  selectedOverlayId?: string;
  showSafeAreaGuides: boolean;
  sourceUrl: string;
}

export function EditorPreviewStage({ className, cleanupAudio, currentTime, isPlaying, onOverlayLayoutChange, onOverlaySelect, onPlaybackTimeChange, project, seekRequest, selectedOverlayId, showSafeAreaGuides, sourceUrl }: EditorPreviewStageProps) {
  const { background, brand, canvasLayout, captions, focusLayout, mode, output, overlays, playback, posterLayout, transcript, videoAdjustments } = project;
  const captionLines = useMemo(() => createCaptionLines(transcript, playback), [playback, transcript]);
  const video = { background, cleanupAudio, isPlaying, onPlaybackTimeChange, playback, seekRequest, sourceUrl, videoFilter: getVideoAdjustmentsFilter(videoAdjustments) };
  const outputSeconds = getOutputElapsedSeconds(currentTime - playback.trimStartSeconds, playback);
  const panX = getFocusPanAt(focusLayout.track ?? [], currentTime, focusLayout.panX);

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      {mode === "poster" ? <PosterVideoPreview {...video} headline={posterLayout.headline} subline={posterLayout.subline} /> : null}
      {mode === "canvas" ? <CanvasVideoPreview {...video} canvasLayout={canvasLayout} /> : null}
      {mode === "focus" ? <PlaybackVideo background={background} className="size-full object-cover" cleanupAudio={cleanupAudio} isPlaying={isPlaying} onPlaybackTimeChange={onPlaybackTimeChange} playback={playback} seekRequest={seekRequest} sourceUrl={sourceUrl} style={{ filter: video.videoFilter, objectPosition: getFocusObjectPosition({ panX, zoom: focusLayout.zoom }), transform: `scale(${focusLayout.zoom})`, transformOrigin: `${panX}% 50%` }} /> : null}
      <CaptionOverlay lines={captionLines} settings={captions} sourceSeconds={currentTime} />
      {overlays.map((overlay) => <VideoHookOverlay isSelected={overlay.id === selectedOverlayId} isVisible={isTextOverlayVisible(overlay, outputSeconds)} key={overlay.id} onChange={(change) => onOverlayLayoutChange(overlay.id, change)} onSelect={() => onOverlaySelect(overlay.id)} overlay={overlay} />)}
      {brand.logoDataUrl ? <BrandLogo corner={brand.logoCorner} sizePercent={brand.logoSizePercent} url={brand.logoDataUrl} /> : null}
      <SocialSafeAreaGuides output={output} visible={showSafeAreaGuides} />
    </div>
  );
}

function BrandLogo({ corner, sizePercent, url }: { corner: ProjectRenderState["brand"]["logoCorner"]; sizePercent: number; url: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- A local data URL has nothing for next/image to optimise.
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ containerType: "inline-size" }}><img alt="" className="absolute h-auto" src={url} style={{ [corner.startsWith("top") ? "top" : "bottom"]: "4cqw", [corner.endsWith("left") ? "left" : "right"]: "4cqw", width: `${sizePercent}cqw` }} /></div>;
}
