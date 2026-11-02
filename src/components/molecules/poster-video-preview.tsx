import { PlaybackVideo } from "@/components/atoms/playback-video";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import type { BackgroundSettings } from "@/features/render/project-render";

interface PosterVideoPreviewProps {
  background: BackgroundSettings;
  cleanupAudio: boolean;
  headline: string;
  isPlaying: boolean;
  onPlaybackTimeChange?(timeSeconds: number): void;
  playback: PlaybackSettings;
  seekRequest: { id: number; timeSeconds: number };
  sourceUrl: string;
  subline: string;
  videoFilter: string;
}

export function PosterVideoPreview({ background, cleanupAudio, headline, isPlaying, onPlaybackTimeChange, playback, seekRequest, sourceUrl, subline, videoFilter }: PosterVideoPreviewProps) {
  return (
    <div className="flex size-full flex-col gap-3 bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-400 p-3 text-white">
      <div>
        <h3 className="text-lg font-semibold leading-tight">{headline || "Your story"}</h3>
        {subline ? <p className="mt-1 text-xs text-white/80">{subline}</p> : null}
      </div>
      <div className="relative min-h-0 flex-1">
        <PlaybackVideo
          background={background}
          className="h-full w-full rounded-md object-contain shadow-lg"
          cleanupAudio={cleanupAudio}
          isPlaying={isPlaying}
          onPlaybackTimeChange={onPlaybackTimeChange}
          playback={playback}
          seekRequest={seekRequest}
          sourceUrl={sourceUrl}
          style={{ filter: videoFilter }}
        />
      </div>
    </div>
  );
}
