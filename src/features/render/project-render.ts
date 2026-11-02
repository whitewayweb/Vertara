import type { BrandKit } from "@/features/brand/brand-kit";
import type { CaptionSettings, TranscriptWord } from "@/features/captions/captions";
import type { OutputSettings } from "@/features/project/output-settings";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import type { TextOverlay } from "@/features/project/text-overlays";
import type { CanvasLayout } from "@/features/render/canvas-layout";
import type { FocusLayout } from "@/features/render/focus-layout";
import type { PosterLayout } from "@/features/render/poster-layout";
import type { VideoAdjustments } from "@/features/render/video-adjustments";

export type ExportLayoutMode = "canvas" | "focus" | "poster";

export interface BackgroundSettings {
  color: string;
  mode: "blur" | "color" | "off";
}

export const defaultBackgroundSettings: BackgroundSettings = { color: "#0f172a", mode: "off" };

/** Everything that affects how the video looks. Preview and export both render from this one object. */
export interface ProjectRenderState {
  background: BackgroundSettings;
  brand: Pick<BrandKit, "logoCorner" | "logoDataUrl" | "logoSizePercent">;
  canvasLayout: CanvasLayout;
  captions: CaptionSettings;
  focusLayout: FocusLayout;
  mode: ExportLayoutMode;
  output: OutputSettings;
  overlays: TextOverlay[];
  playback: PlaybackSettings;
  posterLayout: PosterLayout;
  transcript: TranscriptWord[];
  videoAdjustments: VideoAdjustments;
}
