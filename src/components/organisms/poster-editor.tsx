"use client";

import { Input } from "@/components/ui/input";
import { PosterVideoPreview } from "@/components/molecules/poster-video-preview";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import type { PosterLayout } from "@/features/render/poster-layout";

interface PosterEditorProps {
  layout: PosterLayout;
  onChange(layout: PosterLayout): void;
  playback: PlaybackSettings;
  sourceUrl: string;
}

export function PosterEditor({ layout, onChange, playback, sourceUrl }: PosterEditorProps) {
  return (
    <section aria-labelledby="poster-editor-title" className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Poster layout</p>
          <h2 className="font-semibold" id="poster-editor-title">Title-led preview</h2>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">9:16</span>
      </div>
      <PosterVideoPreview
        className="mx-auto mt-5 aspect-[9/16] w-full max-w-64 rounded-lg shadow-sm"
        headline={layout.headline}
        playback={playback}
        sourceUrl={sourceUrl}
        subline={layout.subline}
      />
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Headline
          <Input onChange={(event) => onChange({ ...layout, headline: event.target.value })} value={layout.headline} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Subline
          <Input onChange={(event) => onChange({ ...layout, subline: event.target.value })} value={layout.subline} />
        </label>
      </div>
    </section>
  );
}
