import { PlaybackVideo } from "@/components/atoms/playback-video";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import type { CanvasLayout } from "@/features/render/canvas-layout";
import type { BackgroundSettings } from "@/features/render/project-render";

interface CanvasVideoPreviewProps {
  background: BackgroundSettings;
  canvasLayout: CanvasLayout;
  cleanupAudio: boolean;
  isPlaying: boolean;
  onPlaybackTimeChange?(timeSeconds: number): void;
  playback: PlaybackSettings;
  seekRequest: { id: number; timeSeconds: number };
  sourceUrl: string;
  videoFilter: string;
}

export function CanvasVideoPreview({ background, canvasLayout, cleanupAudio, isPlaying, onPlaybackTimeChange, playback, seekRequest, sourceUrl, videoFilter }: CanvasVideoPreviewProps) {
  return (
    <>
      <PlaybackVideo
        className="absolute inset-0 h-full w-full scale-110 object-cover"
        decorative
        isPlaying={isPlaying}
        playback={playback}
        seekRequest={seekRequest}
        sourceUrl={sourceUrl}
        style={{ filter: `blur(${canvasLayout.backdropBlurPixels}px) ${videoFilter}`, opacity: canvasLayout.backdropOpacity }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: canvasLayout.dimOpacity }} />
      <div className="relative size-full">
        <PlaybackVideo
          background={background}
          className="h-full w-full object-contain"
          cleanupAudio={cleanupAudio}
          isPlaying={isPlaying}
          onPlaybackTimeChange={onPlaybackTimeChange}
          playback={playback}
          seekRequest={seekRequest}
          sourceUrl={sourceUrl}
          style={{ filter: videoFilter }}
        />
      </div>
    </>
  );
}
