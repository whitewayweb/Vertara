"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { PosterVideoPreview } from "@/components/molecules/poster-video-preview";
import type { PlaybackSettings } from "@/features/project/playback-settings";

interface PosterEditorProps {
  playback: PlaybackSettings;
  sourceUrl: string;
}

export function PosterEditor({ playback, sourceUrl }: PosterEditorProps) {
  const [headline, setHeadline] = useState("A story worth sharing");
  const [subline, setSubline] = useState("Made for the vertical screen");

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
        headline={headline}
        playback={playback}
        sourceUrl={sourceUrl}
        subline={subline}
      />
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Headline
          <Input onChange={(event) => setHeadline(event.target.value)} value={headline} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Subline
          <Input onChange={(event) => setSubline(event.target.value)} value={subline} />
        </label>
      </div>
    </section>
  );
}
