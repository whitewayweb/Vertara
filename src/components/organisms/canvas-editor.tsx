import { CanvasVideoPreview } from "@/components/molecules/canvas-video-preview";
import type { PlaybackSettings } from "@/features/project/playback-settings";

interface CanvasEditorProps {
  playback: PlaybackSettings;
  sourceUrl: string;
}

export function CanvasEditor({ playback, sourceUrl }: CanvasEditorProps) {
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
        className="mx-auto mt-5 aspect-[9/16] w-full max-w-64 rounded-lg shadow-sm"
        playback={playback}
        sourceUrl={sourceUrl}
      />
      <p className="mt-4 text-sm text-muted-foreground">
        The original landscape frame is fully visible over a blurred version of itself.
      </p>
    </section>
  );
}
