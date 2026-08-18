import { CanvasVideoPreview } from "@/components/molecules/canvas-video-preview";
import type { HookSettings } from "@/features/project/hook-settings";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import { createCanvasLayout, type CanvasLayout } from "@/features/render/canvas-layout";

interface CanvasEditorProps {
  hook: HookSettings;
  layout: CanvasLayout;
  onChange(layout: CanvasLayout): void;
  playback: PlaybackSettings;
  sourceUrl: string;
}

export function CanvasEditor({ hook, layout, onChange, playback, sourceUrl }: CanvasEditorProps) {
  return (
    <section aria-labelledby="canvas-editor-title" className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Canvas layout</p>
          <h2 className="font-semibold" id="canvas-editor-title">Full landscape preview</h2>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">9:16</span>
      </div>
      <CanvasVideoPreview
        canvasLayout={layout}
        className="mx-auto mt-5 aspect-[9/16] w-full max-w-64 rounded-lg shadow-sm"
        hook={hook}
        playback={playback}
        sourceUrl={sourceUrl}
      />
      <p className="mt-4 text-sm text-muted-foreground">
        The original landscape frame is fully visible over a blurred version of itself.
      </p>
      <div className="mt-5 space-y-4">
        <label className="grid gap-2 text-sm font-medium">
          Backdrop blur <span className="font-normal text-muted-foreground">{Math.round(layout.backdropBlurPixels)} px</span>
          <input
            aria-label="Backdrop blur"
            max="48"
            min="0"
            onChange={(event) => onChange(createCanvasLayout(Number(event.target.value), layout.backdropOpacity, layout.dimOpacity))}
            type="range"
            value={layout.backdropBlurPixels}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Backdrop intensity <span className="font-normal text-muted-foreground">{Math.round(layout.backdropOpacity * 100)}%</span>
          <input
            aria-label="Backdrop intensity"
            max="1"
            min="0"
            onChange={(event) => onChange(createCanvasLayout(layout.backdropBlurPixels, Number(event.target.value), layout.dimOpacity))}
            step="0.05"
            type="range"
            value={layout.backdropOpacity}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Backdrop dim <span className="font-normal text-muted-foreground">{Math.round(layout.dimOpacity * 100)}%</span>
          <input
            aria-label="Backdrop dim"
            max="0.8"
            min="0"
            onChange={(event) => onChange(createCanvasLayout(layout.backdropBlurPixels, layout.backdropOpacity, Number(event.target.value)))}
            step="0.05"
            type="range"
            value={layout.dimOpacity}
          />
        </label>
      </div>
    </section>
  );
}
