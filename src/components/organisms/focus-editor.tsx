"use client";

import { useState } from "react";

import { PlaybackVideo } from "@/components/atoms/playback-video";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import {
  createFocusLayout,
  defaultFocusLayout,
  getFocusObjectPosition,
} from "@/features/render/focus-layout";

interface FocusEditorProps {
  playback: PlaybackSettings;
  sourceUrl: string;
}

export function FocusEditor({ playback, sourceUrl }: FocusEditorProps) {
  const [layout, setLayout] = useState(defaultFocusLayout);

  function updatePanX(panX: number) {
    setLayout((currentLayout) => createFocusLayout(panX, currentLayout.zoom));
  }

  function updateZoom(zoom: number) {
    setLayout((currentLayout) => createFocusLayout(currentLayout.panX, zoom));
  }

  return (
    <section aria-labelledby="focus-editor-title" className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Focus layout</p>
          <h2 className="font-semibold" id="focus-editor-title">Portrait preview</h2>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">9:16</span>
      </div>
      <div className="mx-auto mt-5 aspect-[9/16] w-full max-w-64 overflow-hidden rounded-lg bg-black shadow-sm">
        <PlaybackVideo
          className="h-full w-full object-cover"
          playback={playback}
          sourceUrl={sourceUrl}
          style={{
            objectPosition: getFocusObjectPosition(layout),
            transform: `scale(${layout.zoom})`,
          }}
        />
      </div>
      <div className="mt-5 space-y-4">
        <label className="grid gap-2 text-sm font-medium">
          Horizontal position <span className="font-normal text-muted-foreground">{Math.round(layout.panX)}%</span>
          <input
            aria-label="Horizontal position"
            max="100"
            min="0"
            onChange={(event) => updatePanX(Number(event.target.value))}
            type="range"
            value={layout.panX}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Zoom <span className="font-normal text-muted-foreground">{layout.zoom.toFixed(2)}×</span>
          <input
            aria-label="Zoom"
            max="2"
            min="1"
            onChange={(event) => updateZoom(Number(event.target.value))}
            step="0.01"
            type="range"
            value={layout.zoom}
          />
        </label>
      </div>
    </section>
  );
}
